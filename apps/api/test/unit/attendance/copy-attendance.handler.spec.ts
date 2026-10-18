import { ATTENDANCE_STATUS, ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import {
	DomainError,
	ForbiddenError,
	NotFoundError,
} from '../../../src/common/errors';
import { CopyAttendanceCommand } from '../../../src/modules/attendance/application/commands/copy-attendance/copy-attendance.command';
import { CopyAttendanceHandler } from '../../../src/modules/attendance/application/commands/copy-attendance/copy-attendance.handler';
import { AttendanceCopyService } from '../../../src/modules/attendance/application/services/attendance-copy.service';
import { AttendanceRecord } from '../../../src/modules/attendance/domain/entities/attendance-record.entity';
import { Subject } from '../../../src/modules/attendance/domain/entities/subject.entity';
import { ISubjectPort } from '../../../src/modules/attendance/domain/ports/subject.port.interface';
import { IAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/attendance-record.repository.interface';

describe('CopyAttendanceHandler', () => {
	let handler: CopyAttendanceHandler;
	let attendanceRepo: MockProxy<IAttendanceRecordRepository>;
	let copyAttendanceService: MockProxy<AttendanceCopyService>;
	let subjectPort: MockProxy<ISubjectPort>;

	beforeEach(() => {
		attendanceRepo = mock<IAttendanceRecordRepository>();
		copyAttendanceService = mock<AttendanceCopyService>();
		subjectPort = mock<ISubjectPort>();
		subjectPort.getSubjectById.mockResolvedValue(
			Subject.reconstitute('sub-1', 'course-1', 'Math', 'user-1', 'tenant-1'),
		);
		handler = new CopyAttendanceHandler(
			attendanceRepo,
			copyAttendanceService,
			subjectPort,
		);
	});

	it('debe lanzar error si no hay registros en la fecha origen', async () => {
		copyAttendanceService.getLastClassRecords.mockResolvedValue([]);

		const command = new CopyAttendanceCommand(
			'user-1',
			ROLES.TEACHER,
			'tenant-1',
			'sub-1',
			new Date(),
			undefined,
		);

		const attempt = handler.execute(command);
		await expect(attempt).rejects.toBeInstanceOf(DomainError);
		await expect(attempt).rejects.toThrow(
			'No se encontraron registros de asistencia para la fecha de origen',
		);
		expect(attendanceRepo.bulkSave).not.toHaveBeenCalled();
	});

	it('debe llamar a getLastClassRecords en el copyAttendanceService', async () => {
		copyAttendanceService.getLastClassRecords.mockResolvedValue([
			mock<AttendanceRecord>({ studentId: 'student-1' }),
		]);
		attendanceRepo.findBySubjectAndDate.mockResolvedValue([]);

		const targetDate = new Date('2026-07-10');
		const command = new CopyAttendanceCommand(
			'user-1',
			ROLES.TEACHER,
			'tenant-1',
			'sub-1',
			targetDate,
			undefined,
		);

		await handler.execute(command);

		expect(copyAttendanceService.getLastClassRecords).toHaveBeenCalledWith(
			'sub-1',
			targetDate,
		);
	});

	it('debe copiar registros ignorando a los alumnos que ya tienen asistencia en la fecha destino', async () => {
		const targetDate = new Date();
		const command = new CopyAttendanceCommand(
			'user-1',
			ROLES.TEACHER,
			'tenant-1',
			'sub-1',
			targetDate,
			undefined,
		);

		// Registros de la clase anterior: Alumno 1 y Alumno 2
		const sourceRecord1 = mock<AttendanceRecord>({
			studentId: 'student-1',
			status: ATTENDANCE_STATUS.PRESENT,
			tenantId: 'tenant-1',
			courseId: 'course-1',
		});
		const sourceRecord2 = mock<AttendanceRecord>({
			studentId: 'student-2',
			status: ATTENDANCE_STATUS.ABSENT,
			tenantId: 'tenant-1',
			courseId: 'course-1',
		});
		copyAttendanceService.getLastClassRecords.mockResolvedValue([
			sourceRecord1,
			sourceRecord2,
		]);

		// Registros existentes hoy: Alumno 1 ya tiene asistencia
		const existingRecord = mock<AttendanceRecord>({ studentId: 'student-1' });
		attendanceRepo.findBySubjectAndDate.mockResolvedValue([existingRecord]);

		await handler.execute(command);

		// Verificamos que bulkSave fue llamado 1 sola vez
		expect(attendanceRepo.bulkSave).toHaveBeenCalledTimes(1);

		// Verificamos que el array guardado solo contiene al Alumno 2
		const savedRecords = attendanceRepo.bulkSave.mock.calls[0][0];
		expect(savedRecords.length).toBe(1);
		expect(savedRecords[0].studentId).toBe('student-2');
		expect(savedRecords[0].status).toBe(ATTENDANCE_STATUS.ABSENT); // Copió el estado
	});

	it('usa sourceDate cuando se provee en vez de targetDate', async () => {
		copyAttendanceService.getLastClassRecords.mockResolvedValue([
			mock<AttendanceRecord>({ studentId: 'student-1' }),
		]);
		attendanceRepo.findBySubjectAndDate.mockResolvedValue([]);

		const sourceDate = new Date('2026-07-08');
		const targetDate = new Date('2026-07-10');
		const command = new CopyAttendanceCommand(
			'user-1',
			ROLES.TEACHER,
			'tenant-1',
			'sub-1',
			targetDate,
			sourceDate,
		);

		await handler.execute(command);

		expect(copyAttendanceService.getLastClassRecords).toHaveBeenCalledWith(
			'sub-1',
			sourceDate,
		);
	});

	it('should reject a teacher who does not teach the subject', async () => {
		const command = new CopyAttendanceCommand(
			'other-teacher',
			ROLES.TEACHER,
			'tenant-1',
			'sub-1',
			new Date('2026-07-10'),
			undefined,
		);

		await expect(handler.execute(command)).rejects.toThrow(ForbiddenError);
		expect(copyAttendanceService.getLastClassRecords).not.toHaveBeenCalled();
		expect(attendanceRepo.bulkSave).not.toHaveBeenCalled();
	});

	it('should reject when subject belongs to another tenant', async () => {
		const command = new CopyAttendanceCommand(
			'user-1',
			ROLES.TEACHER,
			'other-tenant',
			'sub-1',
			new Date('2026-07-10'),
			undefined,
		);

		await expect(handler.execute(command)).rejects.toThrow(ForbiddenError);
	});

	it('should allow an admin on a subject taught by someone else', async () => {
		copyAttendanceService.getLastClassRecords.mockResolvedValue([
			mock<AttendanceRecord>({ studentId: 'student-1' }),
		]);
		attendanceRepo.findBySubjectAndDate.mockResolvedValue([]);
		const command = new CopyAttendanceCommand(
			'admin-1',
			ROLES.ADMIN,
			'tenant-1',
			'sub-1',
			new Date('2026-07-10'),
			undefined,
		);

		await handler.execute(command);

		expect(attendanceRepo.bulkSave).toHaveBeenCalledTimes(1);
	});

	it('should fail with a bad request when the subject does not exist', async () => {
		subjectPort.getSubjectById.mockResolvedValue(null);
		const command = new CopyAttendanceCommand(
			'user-1',
			ROLES.TEACHER,
			'tenant-1',
			'missing',
			new Date('2026-07-10'),
			undefined,
		);

		const attempt = handler.execute(command);
		await expect(attempt).rejects.toBeInstanceOf(NotFoundError);
		await expect(attempt).rejects.toThrow('Materia no encontrada');
	});
});
