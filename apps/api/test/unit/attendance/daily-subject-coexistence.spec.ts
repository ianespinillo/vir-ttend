import { EventEmitter2 } from '@nestjs/event-emitter';
import { ATTENDANCE_STATUS, DAYOFWEEK } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { RegisterDailyAttendanceCommand } from '../../../src/modules/attendance/application/commands/register-daily-attendance/register-daily-attendance.command';
import { RegisterDailyAttendanceHandler } from '../../../src/modules/attendance/application/commands/register-daily-attendance/register-daily-attendance.handler';
import { RegisterSubjectAttendanceCommand } from '../../../src/modules/attendance/application/commands/register-subject-attendance/register-subject-attendance.command';
import { RegisterSubjectAttendanceHandler } from '../../../src/modules/attendance/application/commands/register-subject-attendance/register-subject-attendance.handler';
import { AttendanceRecord } from '../../../src/modules/attendance/domain/entities/attendance-record.entity';
import { ScheduleSlot } from '../../../src/modules/attendance/domain/entities/schedule-slot.entity';
import { ISchedulePort } from '../../../src/modules/attendance/domain/ports/schedule.port.interface';
import { IUnitOfWorkPort } from '../../../src/modules/attendance/domain/ports/unit-of-work.port.interface';
import { IAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/attendance-record.repository.interface';

/**
 * Daily records (no subject) and subject records share one table. They must be
 * able to coexist for the same student and date, and each endpoint must only
 * ever see its own kind of record.
 */
describe('daily and subject attendance coexistence', () => {
	const date = new Date('2026-07-06T12:00:00Z'); // Monday
	let table: AttendanceRecord[];
	let repo: MockProxy<IAttendanceRecordRepository>;
	let eventEmitter: MockProxy<EventEmitter2>;
	let dailyHandler: RegisterDailyAttendanceHandler;
	let subjectHandler: RegisterSubjectAttendanceHandler;

	const upsert = (records: AttendanceRecord[]) => {
		for (const record of records) {
			const index = table.findIndex((r) => r.id === record.id);
			if (index >= 0) table[index] = record;
			else table.push(record);
		}
	};

	beforeEach(() => {
		table = [];
		repo = mock<IAttendanceRecordRepository>();
		repo.findDailyByCourseAndDate.mockImplementation(async (courseId) =>
			table.filter((r) => r.courseId === courseId && !r.subjectId),
		);
		repo.findBySubjectAndDate.mockImplementation(async (subjectId) =>
			table.filter((r) => r.subjectId === subjectId),
		);
		repo.bulkSave.mockImplementation(async (records) => upsert(records));
		const unitOfWork = mock<IUnitOfWorkPort>();
		unitOfWork.run.mockImplementation(async (work) => work());
		const schedulePort = mock<ISchedulePort>();
		schedulePort.findBySubject.mockResolvedValue([
			ScheduleSlot.reconstitute('sub-1', DAYOFWEEK.MONDAY, '08:00', '09:00'),
		]);
		eventEmitter = mock<EventEmitter2>();
		dailyHandler = new RegisterDailyAttendanceHandler(
			repo,
			unitOfWork,
			eventEmitter,
		);
		subjectHandler = new RegisterSubjectAttendanceHandler(
			repo,
			schedulePort,
			unitOfWork,
			eventEmitter,
		);
	});

	const registerDaily = (status: 'present' | 'absent') =>
		dailyHandler.execute(
			new RegisterDailyAttendanceCommand(
				'tenant-1',
				'course-1',
				date,
				[{ studentId: 'student-1', status }],
				'preceptor-1',
			),
		);
	const registerSubject = (status: 'present' | 'absent') =>
		subjectHandler.execute(
			new RegisterSubjectAttendanceCommand(
				'tenant-1',
				'teacher-1',
				'sub-1',
				'course-1',
				date,
				[{ studentId: 'student-1', status }],
			),
		);

	it('keeps one daily and one subject record for the same student and date', async () => {
		await registerDaily(ATTENDANCE_STATUS.PRESENT);
		await registerSubject(ATTENDANCE_STATUS.ABSENT);

		expect(table).toHaveLength(2);
		const daily = table.find((r) => !r.subjectId);
		const subject = table.find((r) => r.subjectId === 'sub-1');
		expect(daily?.status).toBe(ATTENDANCE_STATUS.PRESENT);
		expect(subject?.status).toBe(ATTENDANCE_STATUS.ABSENT);
	});

	it('a daily update never overwrites the subject record, and vice versa', async () => {
		await registerSubject(ATTENDANCE_STATUS.ABSENT);
		await registerDaily(ATTENDANCE_STATUS.PRESENT);
		await registerDaily(ATTENDANCE_STATUS.ABSENT);
		await registerSubject(ATTENDANCE_STATUS.PRESENT);

		expect(table).toHaveLength(2);
		expect(table.find((r) => !r.subjectId)?.status).toBe(
			ATTENDANCE_STATUS.ABSENT,
		);
		expect(table.find((r) => r.subjectId === 'sub-1')?.status).toBe(
			ATTENDANCE_STATUS.PRESENT,
		);
	});

	it('replaying either endpoint is a no-op once both records exist', async () => {
		await registerDaily(ATTENDANCE_STATUS.PRESENT);
		await registerSubject(ATTENDANCE_STATUS.ABSENT);
		repo.bulkSave.mockClear();
		eventEmitter.emit.mockClear();

		await registerDaily(ATTENDANCE_STATUS.PRESENT);
		await registerSubject(ATTENDANCE_STATUS.ABSENT);

		expect(table).toHaveLength(2);
		expect(repo.bulkSave).not.toHaveBeenCalled();
		expect(eventEmitter.emit).not.toHaveBeenCalled();
	});
});
