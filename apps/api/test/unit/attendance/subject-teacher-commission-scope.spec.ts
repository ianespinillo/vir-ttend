import { EventEmitter2 } from '@nestjs/event-emitter';
import { DAYOFWEEK, ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { DomainError, ForbiddenError } from '../../../src/common/errors';
import { RegisterSubjectAttendanceCommand } from '../../../src/modules/attendance/application/commands/register-subject-attendance/register-subject-attendance.command';
import { RegisterSubjectAttendanceHandler } from '../../../src/modules/attendance/application/commands/register-subject-attendance/register-subject-attendance.handler';
import { GetSubjectAttendanceQueryHandler } from '../../../src/modules/attendance/application/queries/get-subject-attendance/get-subject-attendance.handler';
import { GetSubjectAttendanceQuery } from '../../../src/modules/attendance/application/queries/get-subject-attendance/get-subject-attendance.query';
import {
	assertCanReadSubjectAttendance,
	assertCanWriteSubjectAttendance,
	taughtCommissionsOf,
} from '../../../src/modules/attendance/application/services/subject-access.policy';
import { SubjectRosterService } from '../../../src/modules/attendance/application/services/subject-roster.service';
import { ScheduleSlot } from '../../../src/modules/attendance/domain/entities/schedule-slot.entity';
import { Student } from '../../../src/modules/attendance/domain/entities/student.entity';
import { Subject } from '../../../src/modules/attendance/domain/entities/subject.entity';
import { ISchedulePort } from '../../../src/modules/attendance/domain/ports/schedule.port.interface';
import { IStudentPort } from '../../../src/modules/attendance/domain/ports/student.port.interface';
import { ISubjectPort } from '../../../src/modules/attendance/domain/ports/subject.port.interface';
import { IUnitOfWorkPort } from '../../../src/modules/attendance/domain/ports/unit-of-work.port.interface';
import { IWorkshopCommissionPort } from '../../../src/modules/attendance/domain/ports/workshop-commission.port.interface';
import { IAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/attendance-record.repository.interface';
import { restrictAudience } from '../../../src/modules/attendance/domain/services/subject-audience';
import { buildCommissionInfo } from './subject-roster.fixtures';

const splitSubject = Subject.reconstitute(
	'sub-1',
	'course-1',
	'Carpintería',
	'teacher-a',
	'tenant-1',
	[
		{ commissionNumber: 1, teacherId: 'teacher-a' },
		{ commissionNumber: 2, teacherId: 'teacher-b' },
	],
);
const asTeacher = (userId: string) => ({
	userId,
	role: ROLES.TEACHER,
	tenantId: 'tenant-1',
});

describe('Subject teachers per commission (attendance read model)', () => {
	it('defaults to a whole-subject teacher when only teacherId is given', () => {
		const subject = Subject.reconstitute(
			'sub-1',
			'course-1',
			'Math',
			'teacher-1',
			'tenant-1',
		);
		expect(subject.commissionsTaughtBy('teacher-1')).toBe('all');
		expect(subject.commissionsTaughtBy('other')).toEqual([]);
		expect(subject.isTaughtBy('other')).toBe(false);
	});

	it('knows the commissions each teacher covers', () => {
		expect(splitSubject.commissionsTaughtBy('teacher-a')).toEqual([1]);
		expect(splitSubject.commissionsTaughtBy('teacher-b')).toEqual([2]);
		expect(splitSubject.isTaughtBy('teacher-b')).toBe(true);
	});
});

describe('subject access policy with a teacher per commission', () => {
	it.each([
		['read', assertCanReadSubjectAttendance],
		['write', assertCanWriteSubjectAttendance],
	])('%s: lets the teacher of any commission in', (_label, assertAccess) => {
		expect(() =>
			assertAccess(splitSubject, asTeacher('teacher-a')),
		).not.toThrow();
		expect(() =>
			assertAccess(splitSubject, asTeacher('teacher-b')),
		).not.toThrow();
	});

	it.each([
		['read', assertCanReadSubjectAttendance],
		['write', assertCanWriteSubjectAttendance],
	])(
		'%s: rejects a teacher not assigned to the subject',
		(_label, assertAccess) => {
			expect(() => assertAccess(splitSubject, asTeacher('teacher-c'))).toThrow(
				ForbiddenError,
			);
		},
	);

	it('restricts teachers to their commissions and leaves admins and preceptors free', () => {
		expect(taughtCommissionsOf(splitSubject, asTeacher('teacher-a'))).toEqual([
			1,
		]);
		for (const role of [ROLES.ADMIN, ROLES.PRECEPTOR]) {
			expect(
				taughtCommissionsOf(splitSubject, {
					userId: 'x',
					role,
					tenantId: 'tenant-1',
				}),
			).toBe('all');
		}
	});
});

describe('restrictAudience', () => {
	it('keeps the audience for a whole-subject teacher', () => {
		expect(restrictAudience('whole-course', 'all')).toBe('whole-course');
		expect(restrictAudience([1, 2], 'all')).toEqual([1, 2]);
	});

	it('gives a commission teacher their commissions on a whole-course audience', () => {
		expect(restrictAudience('whole-course', [1])).toEqual([1]);
	});

	it('intersects with the slot commissions', () => {
		expect(restrictAudience([1, 2], [2])).toEqual([2]);
		expect(restrictAudience([2], [1])).toEqual([]);
		expect(restrictAudience([1], [1])).toEqual([1]);
	});
});

describe('SubjectRosterService scoped to a teacher commission', () => {
	let schedulePort: MockProxy<ISchedulePort>;
	let commissionPort: MockProxy<IWorkshopCommissionPort>;
	let studentPort: MockProxy<IStudentPort>;
	let roster: SubjectRosterService;

	// 2026-07-06 is a Monday.
	const date = new Date('2026-07-06T12:00:00Z');
	const slot = (commission: 1 | 2 | null) =>
		ScheduleSlot.reconstitute(
			'sub-1',
			DAYOFWEEK.MONDAY,
			'08:00',
			'09:00',
			commission,
		);
	const names = async (taught: 'all' | (1 | 2)[], slots: ScheduleSlot[]) =>
		(await roster.getActiveRoster(splitSubject, date, slots, taught)).map(
			(s) => s.id,
		);

	beforeEach(() => {
		schedulePort = mock<ISchedulePort>();
		commissionPort = mock<IWorkshopCommissionPort>();
		studentPort = mock<IStudentPort>();
		roster = new SubjectRosterService(schedulePort, commissionPort, studentPort);
		studentPort.getActiveByCourseId.mockResolvedValue([
			Student.reconstitute('student-1', 'Ana'),
			Student.reconstitute('student-2', 'Beto'),
		]);
		commissionPort.findByCourse.mockResolvedValue([
			buildCommissionInfo(1),
			buildCommissionInfo(2),
		]);
		commissionPort.getActiveStudents.mockImplementation(async (id) =>
			id === 'commission-1'
				? [Student.reconstitute('student-1', 'Ana')]
				: [Student.reconstitute('student-2', 'Beto')],
		);
	});

	it('a whole-subject teacher keeps the full audience', async () => {
		expect(await names('all', [slot(null)])).toEqual(['student-1', 'student-2']);
	});

	it('a commission teacher gets only their commission on a whole-course audience', async () => {
		expect(await names([1], [slot(null)])).toEqual(['student-1']);
		expect(await names([2], [slot(null)])).toEqual(['student-2']);
	});

	it('intersects the teacher commission with the slot audience', async () => {
		expect(await names([2], [slot(1), slot(2)])).toEqual(['student-2']);
	});

	it('is empty when the slots only target the other commission', async () => {
		expect(await names([1], [slot(2)])).toEqual([]);
		expect(commissionPort.getActiveStudents).not.toHaveBeenCalledWith(
			'commission-2',
		);
	});

	it('lists the whole course when the course has no commissions', async () => {
		commissionPort.findByCourse.mockResolvedValue([]);
		expect(await names([1], [slot(null)])).toEqual(['student-1', 'student-2']);
	});
});

describe('handlers scope the roster to the acting teacher', () => {
	let subjectPort: MockProxy<ISubjectPort>;
	let attendanceRepo: MockProxy<IAttendanceRecordRepository>;
	let schedulePort: MockProxy<ISchedulePort>;
	let commissionPort: MockProxy<IWorkshopCommissionPort>;
	let studentPort: MockProxy<IStudentPort>;
	let rosterService: SubjectRosterService;

	const date = new Date('2026-07-06T12:00:00Z');

	beforeEach(() => {
		subjectPort = mock<ISubjectPort>();
		attendanceRepo = mock<IAttendanceRecordRepository>();
		schedulePort = mock<ISchedulePort>();
		commissionPort = mock<IWorkshopCommissionPort>();
		studentPort = mock<IStudentPort>();
		rosterService = new SubjectRosterService(
			schedulePort,
			commissionPort,
			studentPort,
		);
		subjectPort.getSubjectById.mockResolvedValue(splitSubject);
		schedulePort.findBySubject.mockResolvedValue([
			ScheduleSlot.reconstitute('sub-1', DAYOFWEEK.MONDAY, '08:00', '09:00'),
		]);
		studentPort.getActiveByCourseId.mockResolvedValue([
			Student.reconstitute('student-1', 'Ana'),
			Student.reconstitute('student-2', 'Beto'),
		]);
		commissionPort.findByCourse.mockResolvedValue([
			buildCommissionInfo(1),
			buildCommissionInfo(2),
		]);
		commissionPort.getActiveStudents.mockImplementation(async (id) =>
			id === 'commission-1'
				? [Student.reconstitute('student-1', 'Ana')]
				: [Student.reconstitute('student-2', 'Beto')],
		);
		attendanceRepo.findBySubjectAndDate.mockResolvedValue([]);
	});

	it('a teacher only reads the students of their commission', async () => {
		const handler = new GetSubjectAttendanceQueryHandler(
			subjectPort,
			attendanceRepo,
			rosterService,
		);

		const result = await handler.execute(
			new GetSubjectAttendanceQuery(
				'sub-1',
				date,
				'teacher-a',
				ROLES.TEACHER,
				'tenant-1',
			),
		);

		expect(result.records.map((r) => r.studentId)).toEqual(['student-1']);
	});

	it('a preceptor still reads the whole roster', async () => {
		const handler = new GetSubjectAttendanceQueryHandler(
			subjectPort,
			attendanceRepo,
			rosterService,
		);

		const result = await handler.execute(
			new GetSubjectAttendanceQuery(
				'sub-1',
				date,
				'preceptor-1',
				ROLES.PRECEPTOR,
				'tenant-1',
			),
		);

		expect(result.records.map((r) => r.studentId).sort()).toEqual([
			'student-1',
			'student-2',
		]);
	});

	it('a teacher cannot record students of the other commission', async () => {
		const unitOfWork = mock<IUnitOfWorkPort>();
		unitOfWork.run.mockImplementation(async (work) => work());
		const handler = new RegisterSubjectAttendanceHandler(
			attendanceRepo,
			schedulePort,
			subjectPort,
			rosterService,
			unitOfWork,
			mock<EventEmitter2>(),
		);
		const command = (studentId: string) =>
			new RegisterSubjectAttendanceCommand(
				'tenant-1',
				'teacher-a',
				ROLES.TEACHER,
				'sub-1',
				'course-1',
				date,
				[{ studentId, status: 'present' }],
			);

		await expect(handler.execute(command('student-2'))).rejects.toThrow(
			DomainError,
		);
		await expect(handler.execute(command('student-1'))).resolves.not.toThrow();
	});
});
