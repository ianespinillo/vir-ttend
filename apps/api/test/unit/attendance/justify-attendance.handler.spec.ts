import { EventEmitter2 } from '@nestjs/event-emitter';
import { ATTENDANCE_STATUS } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
// justify-attendance.handler.spec.ts
import { JustifyAttendanceCommand } from '../../../src/modules/attendance/application/commands/justify-attendance/justify-attendance.command';
import { JustifyAttendanceHandler } from '../../../src/modules/attendance/application/commands/justify-attendance/justify-attendance.handler';
import { AcademicYear } from '../../../src/modules/attendance/domain/entities/academic-year.entity';
import { AttendanceRecord } from '../../../src/modules/attendance/domain/entities/attendance-record.entity';
import { IAcademicYearPort } from '../../../src/modules/attendance/domain/ports/academic-year.port.interface';
import { IAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/attendance-record.repository.interface';
import { IJustificationRepository } from '../../../src/modules/attendance/domain/repositories/justification.repository.interface';

describe('JustifyAttendanceHandler', () => {
	let handler: JustifyAttendanceHandler;
	let attendanceRepo: MockProxy<IAttendanceRecordRepository>;
	let justificationRepo: MockProxy<IJustificationRepository>;
	let academicYearPort: MockProxy<IAcademicYearPort>;
	let eventEmitter: MockProxy<EventEmitter2>;

	const mockRecord = AttendanceRecord.reconstitute({
		id: 'record-id',
		tenantId: 'tenant-id',
		studentId: 'student-1',
		courseId: 'course-id',
		date: new Date('2025-03-10'),
		status: ATTENDANCE_STATUS.ABSENT,
		editedBy: 'user-id',
		editedAt: new Date(),
		createdAt: new Date(),
	});

	beforeEach(() => {
		attendanceRepo = mock<IAttendanceRecordRepository>();
		justificationRepo = mock<IJustificationRepository>();
		academicYearPort = mock<IAcademicYearPort>();
		eventEmitter = mock<EventEmitter2>();
		handler = new JustifyAttendanceHandler(
			justificationRepo,
			attendanceRepo,
			eventEmitter,
			academicYearPort,
		);
	});

	it('should justify absent record', async () => {
		attendanceRepo.findById.mockResolvedValue(mockRecord);
		academicYearPort.findActiveByTenant.mockResolvedValue(
			AcademicYear.reconstitute(
				'ay-1',
				75,
				15,
				new Date('2026-03-01'),
				new Date('2026-12-31'),
			),
		);

		await handler.execute(
			new JustifyAttendanceCommand(
				'record-id',
				'Enfermedad',
				'user-id',
				'Certificado médico',
			),
		);

		expect(justificationRepo.save).toHaveBeenCalledTimes(1);
		expect(attendanceRepo.save).toHaveBeenCalledTimes(1);
		const saved = attendanceRepo.save.mock.calls[0][0];
		expect(saved.status).toBe(ATTENDANCE_STATUS.JUSTIFIED);
	});

	it('should throw when record does not exist', async () => {
		attendanceRepo.findById.mockResolvedValue(null);

		await expect(
			handler.execute(
				new JustifyAttendanceCommand(
					'record-id',
					'Enfermedad',
					'user-id',
					undefined,
				),
			),
		).rejects.toThrow();

		expect(justificationRepo.save).not.toHaveBeenCalled();
	});

	it('should throw when record is not absent', async () => {
		const presentRecord = AttendanceRecord.reconstitute({
			...mockRecord,
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
		attendanceRepo.findById.mockResolvedValue(presentRecord);

		await expect(
			handler.execute(
				new JustifyAttendanceCommand(
					'record-id',
					'Enfermedad',
					'user-id',
					undefined,
				),
			),
		).rejects.toThrow();

		expect(justificationRepo.save).not.toHaveBeenCalled();
	});
});
