import { EventEmitter2 } from '@nestjs/event-emitter';
// bulk-register-attendance.handler.spec.ts
import { ATTENDANCE_STATUS } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { BulkRegisterAttendanceCommand } from '../../../src/modules/attendance/application/commands/bulk-register-attendance/bulk-register-attendance.command';
import { BulkRegisterAttendanceHandler } from '../../../src/modules/attendance/application/commands/bulk-register-attendance/bulk-register-attendance.handler';
import { AttendanceRecord } from '../../../src/modules/attendance/domain/entities/attendance-record.entity';
import { Student } from '../../../src/modules/attendance/domain/entities/student';
import { IStudentPort } from '../../../src/modules/attendance/domain/ports/student.port.interface';
import { IAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/attendance-record.repository.interface';

describe('BulkRegisterAttendanceHandler', () => {
	let handler: BulkRegisterAttendanceHandler;
	let attendanceRepo: MockProxy<IAttendanceRecordRepository>;
	let studentPort: MockProxy<IStudentPort>;
	let eventEmitter: MockProxy<EventEmitter2>;

	const mockStudents = [
		Student.reconstitute('student-1', 'Student 1'),
		Student.reconstitute('student-2', 'Student 2'),
		Student.reconstitute('student-3', 'Student 3'),
	];

	beforeEach(() => {
		attendanceRepo = mock<IAttendanceRecordRepository>();
		studentPort = mock<IStudentPort>();
		eventEmitter = mock<EventEmitter2>();
		handler = new BulkRegisterAttendanceHandler(
			attendanceRepo,
			eventEmitter,
			studentPort,
		);
	});

	it('should create records for all students with default status', async () => {
		studentPort.getByCourseId.mockResolvedValue(mockStudents);
		attendanceRepo.findByStudentAndCourseAndDate.mockResolvedValue(null);

		await handler.execute(
			new BulkRegisterAttendanceCommand(
				'tenant-id',
				'course-id',
				new Date('2025-03-10'),
				ATTENDANCE_STATUS.PRESENT,
				'user-id',
			),
		);

		const saved = attendanceRepo.bulkSave.mock.calls[0][0];
		expect(saved).toHaveLength(3);
		expect(saved.every((r) => r.status === ATTENDANCE_STATUS.PRESENT)).toBe(true);
		expect(eventEmitter.emit).toHaveBeenCalledTimes(3);
	});

	it('should update existing records', async () => {
		studentPort.getByCourseId.mockResolvedValue([mockStudents[0]]);
		const existing = AttendanceRecord.reconstitute({
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
		attendanceRepo.findByStudentAndCourseAndDate.mockResolvedValue(existing);

		await handler.execute(
			new BulkRegisterAttendanceCommand(
				'tenant-id',
				'course-id',
				new Date('2025-03-10'),
				ATTENDANCE_STATUS.ABSENT,
				'user-id',
			),
		);

		const saved = attendanceRepo.bulkSave.mock.calls[0][0];
		expect(saved[0].status).toBe(ATTENDANCE_STATUS.ABSENT);
	});
});
