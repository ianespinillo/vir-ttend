import { ATTENDANCE_STATUS, AttendanceStatus } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { GetAttendanceByStudentQueryHandler } from '../../../src/modules/attendance/application/queries/get-attendance-by-student/get-attendance-by-student.handler';
import { GetAttendanceByStudentQuery } from '../../../src/modules/attendance/application/queries/get-attendance-by-student/get-attendance-by-student.query';
import { AttendanceRecord } from '../../../src/modules/attendance/domain/entities/attendance-record.entity';
import { Justification } from '../../../src/modules/attendance/domain/entities/justification.entity';
import { Student } from '../../../src/modules/attendance/domain/entities/student.entity';
import { IStudentPort } from '../../../src/modules/attendance/domain/ports/student.port.interface';
import { IAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/attendance-record.repository.interface';
import { IJustificationRepository } from '../../../src/modules/attendance/domain/repositories/justification.repository.interface';

function record(id: string, status: AttendanceStatus): AttendanceRecord {
	return AttendanceRecord.reconstitute({
		id,
		tenantId: 'tenant-id',
		studentId: 'student-1',
		courseId: 'course-id',
		date: new Date('2026-10-21'),
		status,
		editedBy: 'user-id',
		editedAt: new Date(),
		createdAt: new Date('2026-10-21T12:00:00Z'),
	});
}

describe('GetAttendanceByStudentQueryHandler', () => {
	let handler: GetAttendanceByStudentQueryHandler;
	let attendanceRepo: MockProxy<IAttendanceRecordRepository>;
	let justificationRepo: MockProxy<IJustificationRepository>;
	let studentPort: MockProxy<IStudentPort>;
	const from = new Date('2026-10-01');
	const to = new Date('2026-10-31');

	beforeEach(() => {
		attendanceRepo = mock<IAttendanceRecordRepository>();
		justificationRepo = mock<IJustificationRepository>();
		studentPort = mock<IStudentPort>();
		studentPort.findById.mockResolvedValue(
			Student.reconstitute('student-1', 'Martina González'),
		);
		handler = new GetAttendanceByStudentQueryHandler(
			attendanceRepo,
			justificationRepo,
			studentPort,
		);
	});

	it('reads daily records only, the same source as the present counter', async () => {
		attendanceRepo.findDailyByStudentAndDateRange.mockResolvedValue([
			record('r-1', ATTENDANCE_STATUS.PRESENT),
		]);

		const result = await handler.execute(
			new GetAttendanceByStudentQuery('student-1', from, to),
		);

		expect(attendanceRepo.findDailyByStudentAndDateRange).toHaveBeenCalledWith(
			'student-1',
			from,
			to,
		);
		expect(attendanceRepo.findByStudentAndDateRange).not.toHaveBeenCalled();
		expect(result).toHaveLength(1);
		expect(result[0].status).toBe(ATTENDANCE_STATUS.PRESENT);
	});

	it('returns a justified record once, with its justification', async () => {
		attendanceRepo.findDailyByStudentAndDateRange.mockResolvedValue([
			record('r-1', ATTENDANCE_STATUS.JUSTIFIED),
			record('r-2', ATTENDANCE_STATUS.ABSENT),
		]);
		justificationRepo.findByRecord.mockResolvedValue(
			Justification.create({
				attendanceRecordId: 'r-1',
				reason: 'Enfermedad',
				notes: 'Certificado médico',
				createdBy: 'user-id',
			}),
		);

		const result = await handler.execute(
			new GetAttendanceByStudentQuery('student-1', from, to),
		);

		expect(result.map((r) => r.id)).toEqual(['r-1', 'r-2']);
		expect(result[0].justification).toBeDefined();
		expect(result[1].justification).toBeUndefined();
	});
});
