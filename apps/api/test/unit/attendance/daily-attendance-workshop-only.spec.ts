import { EventEmitter2 } from '@nestjs/event-emitter';
import {
	ATTENDANCE_STATUS,
	LEVEL,
	WORKSHOP_ONLY_DAILY_ATTENDANCE_MESSAGE,
} from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { DomainError } from '../../../src/common/errors';
import { BulkRegisterAttendanceCommand } from '../../../src/modules/attendance/application/commands/bulk-register-attendance/bulk-register-attendance.command';
import { BulkRegisterAttendanceHandler } from '../../../src/modules/attendance/application/commands/bulk-register-attendance/bulk-register-attendance.handler';
import { CopyDailyAttendanceCommand } from '../../../src/modules/attendance/application/commands/copy-daily-attendance/copy-daily-attendance.command';
import { CopyDailyAttendanceHandler } from '../../../src/modules/attendance/application/commands/copy-daily-attendance/copy-daily-attendance.handler';
import { RegisterDailyAttendanceCommand } from '../../../src/modules/attendance/application/commands/register-daily-attendance/register-daily-attendance.command';
import { RegisterDailyAttendanceHandler } from '../../../src/modules/attendance/application/commands/register-daily-attendance/register-daily-attendance.handler';
import { AttendanceRecord } from '../../../src/modules/attendance/domain/entities/attendance-record.entity';
import { Course } from '../../../src/modules/attendance/domain/entities/course.entity';
import { Student } from '../../../src/modules/attendance/domain/entities/student.entity';
import { ICoursePort } from '../../../src/modules/attendance/domain/ports/courses.port.interface';
import { IStudentPort } from '../../../src/modules/attendance/domain/ports/student.port.interface';
import { IUnitOfWorkPort } from '../../../src/modules/attendance/domain/ports/unit-of-work.port.interface';
import { IAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/attendance-record.repository.interface';
import { IDailySessionNotHeldRepository } from '../../../src/modules/attendance/domain/repositories/daily-session-not-held.repository.interface';

/**
 * 7th year of technical secondary schools has only workshop subjects: there is
 * no daily attendance, so every daily write rejects those courses.
 */
describe('daily attendance in a workshop-only course (7th year technical)', () => {
	const date = new Date('2026-03-10');
	const seventh = Course.reconstitute(
		'course-id',
		'7° A',
		'year-1',
		true,
		LEVEL.SECONDARY,
		7,
	);
	const regular = Course.reconstitute(
		'course-id',
		'6° A',
		'year-1',
		true,
		LEVEL.SECONDARY,
		6,
	);
	const primarySeventh = Course.reconstitute(
		'course-id',
		'7° A',
		'year-1',
		true,
		LEVEL.PRIMARY,
		7,
	);

	let attendanceRepo: MockProxy<IAttendanceRecordRepository>;
	let coursePort: MockProxy<ICoursePort>;
	let notHeldRepo: MockProxy<IDailySessionNotHeldRepository>;
	let studentPort: MockProxy<IStudentPort>;
	let unitOfWork: MockProxy<IUnitOfWorkPort>;
	let eventEmitter: MockProxy<EventEmitter2>;

	beforeEach(() => {
		attendanceRepo = mock<IAttendanceRecordRepository>();
		coursePort = mock<ICoursePort>();
		notHeldRepo = mock<IDailySessionNotHeldRepository>();
		notHeldRepo.findByCourseAndDate.mockResolvedValue(null);
		studentPort = mock<IStudentPort>();
		unitOfWork = mock<IUnitOfWorkPort>();
		unitOfWork.run.mockImplementation(async (work) => work());
		eventEmitter = mock<EventEmitter2>();
		attendanceRepo.findDailyByCourseAndDate.mockResolvedValue([]);
		attendanceRepo.findByStudentAndCourseAndDate.mockResolvedValue(null);
		studentPort.getByCourseId.mockResolvedValue([
			Student.reconstitute('student-1', 'Ana'),
		]);
	});

	const expectRejected = async (attempt: Promise<unknown>) => {
		await expect(attempt).rejects.toBeInstanceOf(DomainError);
		await expect(attempt).rejects.toThrow(WORKSHOP_ONLY_DAILY_ATTENDANCE_MESSAGE);
		expect(attendanceRepo.bulkSave).not.toHaveBeenCalled();
		expect(eventEmitter.emit).not.toHaveBeenCalled();
	};

	describe('RegisterDailyAttendanceHandler', () => {
		const run = () =>
			new RegisterDailyAttendanceHandler(
				attendanceRepo,
				unitOfWork,
				eventEmitter,
				coursePort,
				notHeldRepo,
			).execute(
				new RegisterDailyAttendanceCommand(
					'tenant-id',
					'course-id',
					date,
					[{ studentId: 'student-1', status: ATTENDANCE_STATUS.ABSENT }],
					'user-id',
				),
			);

		it('rejects a 7th-year technical course', async () => {
			coursePort.findById.mockResolvedValue(seventh);
			await expectRejected(run());
		});

		it.each([
			['a regular secondary course', regular],
			['a primary 7th grade', primarySeventh],
		])('still registers %s', async (_label, course) => {
			coursePort.findById.mockResolvedValue(course);
			await run();
			expect(attendanceRepo.bulkSave).toHaveBeenCalledTimes(1);
		});
	});

	describe('BulkRegisterAttendanceHandler', () => {
		const run = () =>
			new BulkRegisterAttendanceHandler(
				attendanceRepo,
				eventEmitter,
				studentPort,
				coursePort,
				notHeldRepo,
				unitOfWork,
			).execute(
				new BulkRegisterAttendanceCommand(
					'tenant-id',
					'course-id',
					date,
					ATTENDANCE_STATUS.PRESENT,
					'user-id',
				),
			);

		it('rejects a 7th-year technical course', async () => {
			coursePort.findById.mockResolvedValue(seventh);
			await expectRejected(run());
		});

		it('still marks a regular course', async () => {
			coursePort.findById.mockResolvedValue(regular);
			await run();
			expect(attendanceRepo.bulkSave).toHaveBeenCalledTimes(1);
		});
	});

	describe('CopyDailyAttendanceHandler', () => {
		const run = () =>
			new CopyDailyAttendanceHandler(
				attendanceRepo,
				coursePort,
				notHeldRepo,
				unitOfWork,
			).execute(
				new CopyDailyAttendanceCommand(
					'user-id',
					'course-id',
					date,
					new Date('2026-03-09'),
				),
			);

		it('rejects a 7th-year technical course', async () => {
			coursePort.findById.mockResolvedValue(seventh);
			await expectRejected(run());
		});

		it('still copies a regular course', async () => {
			coursePort.findById.mockResolvedValue(regular);
			attendanceRepo.findByCourseAndDate.mockImplementation(async (_c, d) =>
				d.getTime() === new Date('2026-03-09').getTime()
					? [
							AttendanceRecord.reconstitute({
								id: 'r1',
								tenantId: 'tenant-id',
								studentId: 'student-1',
								courseId: 'course-id',
								date: new Date('2026-03-09'),
								status: ATTENDANCE_STATUS.ABSENT,
								editedBy: 'user-id',
								editedAt: new Date('2026-03-09'),
								createdAt: new Date('2026-03-09'),
							}),
						]
					: [],
			);
			await run();
			expect(attendanceRepo.bulkSave).toHaveBeenCalledTimes(1);
		});
	});
});
