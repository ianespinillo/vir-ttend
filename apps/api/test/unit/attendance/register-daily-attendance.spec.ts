import { EventEmitter2 } from '@nestjs/event-emitter';
import { ATTENDANCE_STATUS } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
// register-daily-attendance.handler.spec.ts
import { RegisterDailyAttendanceCommand } from '../../../src/modules/attendance/application/commands/register-daily-attendance/register-daily-attendance.command';
import { RegisterDailyAttendanceHandler } from '../../../src/modules/attendance/application/commands/register-daily-attendance/register-daily-attendance.handler';
import { AttendanceRecord } from '../../../src/modules/attendance/domain/entities/attendance-record.entity';
import { IAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/attendance-record.repository.interface';

describe('RegisterDailyAttendanceHandler', () => {
	let handler: RegisterDailyAttendanceHandler;
	let attendanceRepo: MockProxy<IAttendanceRecordRepository>;
	let eventEmitter: MockProxy<EventEmitter2>;

	beforeEach(() => {
		attendanceRepo = mock<IAttendanceRecordRepository>();
		eventEmitter = mock<EventEmitter2>();
		handler = new RegisterDailyAttendanceHandler(attendanceRepo, eventEmitter);
	});

	it('should create new records when none exist', async () => {
		attendanceRepo.findByStudentAndCourseAndDate.mockResolvedValue(null);

		await handler.execute(
			new RegisterDailyAttendanceCommand(
				'tenant-id',
				'course-id',
				new Date('2025-03-10'),
				[
					{ studentId: 'student-1', status: ATTENDANCE_STATUS.PRESENT },
					{ studentId: 'student-2', status: ATTENDANCE_STATUS.ABSENT },
				],
				'user-id',
			),
		);

		expect(attendanceRepo.bulkSave).toHaveBeenCalledTimes(1);
		const saved = attendanceRepo.bulkSave.mock.calls[0][0];
		expect(saved).toHaveLength(2);
		expect(eventEmitter.emit).toHaveBeenCalledTimes(2);
	});

	it('should update existing records', async () => {
		const existingRecord = AttendanceRecord.reconstitute({
			id: 'record-id',
			tenantId: 'tenant-id',
			studentId: 'student-1',
			courseId: 'course-id',
			date: new Date('2025-03-10'),
			status: ATTENDANCE_STATUS.PRESENT,
			editedBy: 'user-id',
			editedAt: new Date(),
			createdAt: new Date(),
		});
		attendanceRepo.findByStudentAndCourseAndDate.mockResolvedValue(
			existingRecord,
		);

		await handler.execute(
			new RegisterDailyAttendanceCommand(
				'tenant-id',
				'course-id',
				new Date('2025-03-10'),
				[{ studentId: 'student-1', status: ATTENDANCE_STATUS.ABSENT }],
				'user-id',
			),
		);

		const saved = attendanceRepo.bulkSave.mock.calls[0][0];
		expect(saved[0].status).toBe(ATTENDANCE_STATUS.ABSENT);
	});
});
