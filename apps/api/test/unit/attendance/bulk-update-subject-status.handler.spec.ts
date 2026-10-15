import { EventEmitter2 } from '@nestjs/event-emitter';
import { ATTENDANCE_STATUS, ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { ForbiddenError } from '../../../src/common/errors';
import { BulkUpdateSubjectStatusCommand } from '../../../src/modules/attendance/application/commands/bulk-update-subject-status/bulk-update-subject-status.command';
import { BulkUpdateSubjectStatusHandler } from '../../../src/modules/attendance/application/commands/bulk-update-subject-status/bulk-update-subject-status.handler';
import { AttendanceRecord } from '../../../src/modules/attendance/domain/entities/attendance-record.entity';
import { Student } from '../../../src/modules/attendance/domain/entities/student.entity';
import { Subject } from '../../../src/modules/attendance/domain/entities/subject.entity';
import { IStudentPort } from '../../../src/modules/attendance/domain/ports/student.port.interface';
import { ISubjectPort } from '../../../src/modules/attendance/domain/ports/subject.port.interface';
import { IUnitOfWorkPort } from '../../../src/modules/attendance/domain/ports/unit-of-work.port.interface';
import { IAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/attendance-record.repository.interface';

describe('BulkUpdateSubjectStatusHandler', () => {
	let handler: BulkUpdateSubjectStatusHandler;
	let attendanceRepo: MockProxy<IAttendanceRecordRepository>;
	let subjectPort: MockProxy<ISubjectPort>;
	let studentPort: MockProxy<IStudentPort>;
	let unitOfWork: MockProxy<IUnitOfWorkPort>;
	let eventEmitter: MockProxy<EventEmitter2>;

	const date = new Date('2026-07-06T12:00:00Z');
	const command = new BulkUpdateSubjectStatusCommand(
		'user-1',
		ROLES.TEACHER,
		'tenant-1',
		'sub-1',
		date,
		ATTENDANCE_STATUS.PRESENT,
	);
	const buildExisting = (studentId: string, status: 'present' | 'absent') =>
		AttendanceRecord.reconstitute({
			id: `record-${studentId}`,
			tenantId: 'tenant-1',
			studentId,
			courseId: 'course-1',
			subjectId: 'sub-1',
			date,
			status,
			editedBy: 'user-1',
			editedAt: new Date('2026-07-06T08:00:00Z'),
			createdAt: new Date('2026-07-06T08:00:00Z'),
		});

	beforeEach(() => {
		attendanceRepo = mock<IAttendanceRecordRepository>();
		subjectPort = mock<ISubjectPort>();
		studentPort = mock<IStudentPort>();
		unitOfWork = mock<IUnitOfWorkPort>();
		unitOfWork.run.mockImplementation(async (work) => work());
		eventEmitter = mock<EventEmitter2>();
		handler = new BulkUpdateSubjectStatusHandler(
			attendanceRepo,
			subjectPort,
			studentPort,
			unitOfWork,
			eventEmitter,
		);
		subjectPort.getSubjectById.mockResolvedValue(
			Subject.reconstitute('sub-1', 'course-1', 'Math', 'user-1', 'tenant-1'),
		);
		studentPort.getByCourseId.mockResolvedValue([
			Student.reconstitute('student-1', 'Ana'),
			Student.reconstitute('student-2', 'Beto'),
		]);
	});

	it('should create missing subject records and update changed ones without duplicating', async () => {
		attendanceRepo.findBySubjectAndDate.mockResolvedValue([
			buildExisting('student-1', ATTENDANCE_STATUS.ABSENT),
		]);

		await handler.execute(command);

		expect(attendanceRepo.findBySubjectAndDate).toHaveBeenCalledWith(
			'sub-1',
			date,
		);
		const saved = attendanceRepo.bulkSave.mock.calls[0][0];
		expect(saved.map((r) => r.studentId)).toEqual(['student-1', 'student-2']);
		expect(saved[0].id).toBe('record-student-1');
		expect(saved.every((r) => r.status === ATTENDANCE_STATUS.PRESENT)).toBe(true);
		expect(eventEmitter.emit).toHaveBeenCalledTimes(2);
	});

	it('should save nothing and emit nothing when every record already has the status', async () => {
		attendanceRepo.findBySubjectAndDate.mockResolvedValue([
			buildExisting('student-1', ATTENDANCE_STATUS.PRESENT),
			buildExisting('student-2', ATTENDANCE_STATUS.PRESENT),
		]);

		await handler.execute(command);

		expect(attendanceRepo.bulkSave).not.toHaveBeenCalled();
		expect(eventEmitter.emit).not.toHaveBeenCalled();
	});

	it('should reject a teacher who does not teach the subject', async () => {
		const foreign = new BulkUpdateSubjectStatusCommand(
			'other-teacher',
			ROLES.TEACHER,
			'tenant-1',
			'sub-1',
			date,
			ATTENDANCE_STATUS.PRESENT,
		);

		await expect(handler.execute(foreign)).rejects.toThrow(ForbiddenError);
		expect(attendanceRepo.bulkSave).not.toHaveBeenCalled();
		expect(eventEmitter.emit).not.toHaveBeenCalled();
	});

	it('should allow an admin on a subject taught by someone else', async () => {
		attendanceRepo.findBySubjectAndDate.mockResolvedValue([]);
		const asAdmin = new BulkUpdateSubjectStatusCommand(
			'admin-1',
			ROLES.ADMIN,
			'tenant-1',
			'sub-1',
			date,
			ATTENDANCE_STATUS.PRESENT,
		);

		await handler.execute(asAdmin);

		expect(attendanceRepo.bulkSave).toHaveBeenCalledTimes(1);
	});

	it('should reject when subject belongs to another tenant', async () => {
		const crossTenant = new BulkUpdateSubjectStatusCommand(
			'user-1',
			ROLES.TEACHER,
			'other-tenant',
			'sub-1',
			date,
			ATTENDANCE_STATUS.PRESENT,
		);

		await expect(handler.execute(crossTenant)).rejects.toThrow(ForbiddenError);
	});
});
