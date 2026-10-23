import { UnprocessableEntityException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ATTENDANCE_STATUS, AttendanceStatus } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { BulkJustifyAttendanceCommand } from '../../../src/modules/attendance/application/commands/bulk-justify-attendance/bulk-justify-attendance.command';
import { BulkJustifyAttendanceHandler } from '../../../src/modules/attendance/application/commands/bulk-justify-attendance/bulk-justify-attendance.handler';
import { AcademicYear } from '../../../src/modules/attendance/domain/entities/academic-year.entity';
import { AttendanceRecord } from '../../../src/modules/attendance/domain/entities/attendance-record.entity';
import { AttendanceJustifiedEvent } from '../../../src/modules/attendance/domain/events/attendance-justified.event';
import { IAcademicYearPort } from '../../../src/modules/attendance/domain/ports/academic-year.port.interface';
import { IUnitOfWorkPort } from '../../../src/modules/attendance/domain/ports/unit-of-work.port.interface';
import { IAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/attendance-record.repository.interface';
import { IJustificationRepository } from '../../../src/modules/attendance/domain/repositories/justification.repository.interface';

const TENANT = 'tenant-id';

const record = (
	id: string,
	status: AttendanceStatus = ATTENDANCE_STATUS.ABSENT,
	tenantId = TENANT,
) =>
	AttendanceRecord.reconstitute({
		id,
		tenantId,
		studentId: `student-${id}`,
		courseId: 'course-id',
		date: new Date('2026-05-10'),
		status,
		editedBy: 'user-id',
		editedAt: new Date(),
		createdAt: new Date('2026-05-10T12:00:00Z'),
	});

describe('BulkJustifyAttendanceHandler', () => {
	let handler: BulkJustifyAttendanceHandler;
	let attendanceRepo: MockProxy<IAttendanceRecordRepository>;
	let justificationRepo: MockProxy<IJustificationRepository>;
	let academicYearPort: MockProxy<IAcademicYearPort>;
	let events: MockProxy<EventEmitter2>;
	let unitOfWork: MockProxy<IUnitOfWorkPort>;

	const command = (ids: string[]) =>
		new BulkJustifyAttendanceCommand(
			TENANT,
			ids,
			'Enfermedad',
			'user-id',
			'Certificado',
		);

	const failureOf = async (ids: string[]) => {
		const error = await handler.execute(command(ids)).catch((e) => e);
		expect(error).toBeInstanceOf(UnprocessableEntityException);
		return (error as UnprocessableEntityException).getResponse() as {
			message: string;
			details: { recordId: string; reason: string }[];
		};
	};

	beforeEach(() => {
		attendanceRepo = mock<IAttendanceRecordRepository>();
		justificationRepo = mock<IJustificationRepository>();
		academicYearPort = mock<IAcademicYearPort>();
		events = mock<EventEmitter2>();
		unitOfWork = mock<IUnitOfWorkPort>();
		unitOfWork.run.mockImplementation((work) => work());
		academicYearPort.findActiveByTenant.mockResolvedValue(
			AcademicYear.reconstitute(
				'ay-1',
				75,
				15,
				new Date('2026-03-01'),
				new Date('2026-12-31'),
			),
		);
		handler = new BulkJustifyAttendanceHandler(
			justificationRepo,
			attendanceRepo,
			events,
			academicYearPort,
			unitOfWork,
		);
	});

	it('justifies every record, marks them JUSTIFIED and emits one event each', async () => {
		const records = [
			record('a', ATTENDANCE_STATUS.ABSENT),
			record('b', ATTENDANCE_STATUS.LATE),
			record('c', ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE),
		];
		attendanceRepo.findByIds.mockResolvedValue(records);

		const result = await handler.execute(command(['a', 'b', 'c']));

		expect(result).toEqual({ justified: 3 });
		expect(unitOfWork.run).toHaveBeenCalledTimes(1);
		expect(justificationRepo.save).toHaveBeenCalledTimes(3);
		const saved = justificationRepo.save.mock.calls.map(([j]) => j);
		expect(saved.map((j) => j.attendanceRecordId.getRaw())).toEqual([
			'a',
			'b',
			'c',
		]);
		expect(saved.every((j) => j.reason.getRaw() === 'Enfermedad')).toBe(true);
		expect(saved.every((j) => j.notes === 'Certificado')).toBe(true);
		expect(attendanceRepo.save).toHaveBeenCalledTimes(3);
		expect(records.map((r) => r.status)).toEqual([
			ATTENDANCE_STATUS.JUSTIFIED,
			ATTENDANCE_STATUS.JUSTIFIED,
			ATTENDANCE_STATUS.JUSTIFIED,
		]);
		expect(events.emit).toHaveBeenCalledTimes(3);
		const [name, event] = events.emit.mock.calls[0];
		expect(name).toBe('justification');
		expect(event).toBeInstanceOf(AttendanceJustifiedEvent);
	});

	it('emits the events only after the unit of work finished', async () => {
		attendanceRepo.findByIds.mockResolvedValue([record('a')]);
		unitOfWork.run.mockImplementation(async (work) => {
			const out = await work();
			expect(events.emit).not.toHaveBeenCalled();
			return out;
		});

		await handler.execute(command(['a']));

		expect(events.emit).toHaveBeenCalledTimes(1);
	});

	it('saves nothing when one record is present and names it', async () => {
		attendanceRepo.findByIds.mockResolvedValue([
			record('a'),
			record('b', ATTENDANCE_STATUS.PRESENT),
		]);

		const response = await failureOf(['a', 'b']);

		expect(response.details).toEqual([
			{
				recordId: 'b',
				reason:
					'Solo se pueden justificar inasistencias o tardanzas del ciclo lectivo activo.',
			},
		]);
		expect(unitOfWork.run).not.toHaveBeenCalled();
		expect(justificationRepo.save).not.toHaveBeenCalled();
		expect(attendanceRepo.save).not.toHaveBeenCalled();
		expect(events.emit).not.toHaveBeenCalled();
	});

	it('names a missing record', async () => {
		attendanceRepo.findByIds.mockResolvedValue([record('a')]);

		const response = await failureOf(['a', 'ghost']);

		expect(response.details).toEqual([
			{ recordId: 'ghost', reason: 'Registro de asistencia no encontrado' },
		]);
		expect(justificationRepo.save).not.toHaveBeenCalled();
	});

	it('names an already justified record', async () => {
		attendanceRepo.findByIds.mockResolvedValue([
			record('a'),
			record('b', ATTENDANCE_STATUS.JUSTIFIED),
		]);

		const response = await failureOf(['a', 'b']);

		expect(response.details.map((d) => d.recordId)).toEqual(['b']);
		expect(attendanceRepo.save).not.toHaveBeenCalled();
	});

	it('reports every failing record, not only the first', async () => {
		attendanceRepo.findByIds.mockResolvedValue([
			record('a', ATTENDANCE_STATUS.PRESENT),
			record('b', ATTENDANCE_STATUS.JUSTIFIED),
		]);

		const response = await failureOf(['a', 'b', 'ghost']);

		expect(response.details.map((d) => d.recordId)).toEqual(['a', 'b', 'ghost']);
	});

	it('treats a record of another tenant as not found', async () => {
		attendanceRepo.findByIds.mockResolvedValue([
			record('a', ATTENDANCE_STATUS.ABSENT, 'other-tenant'),
		]);

		const response = await failureOf(['a']);

		expect(response.details).toEqual([
			{ recordId: 'a', reason: 'Registro de asistencia no encontrado' },
		]);
		expect(justificationRepo.save).not.toHaveBeenCalled();
	});

	it('rejects records outside the active academic year', async () => {
		academicYearPort.findActiveByTenant.mockResolvedValue(
			AcademicYear.reconstitute(
				'ay-0',
				75,
				15,
				new Date('2025-03-01'),
				new Date('2025-12-31'),
			),
		);
		attendanceRepo.findByIds.mockResolvedValue([record('a')]);

		const response = await failureOf(['a']);

		expect(response.details.map((d) => d.recordId)).toEqual(['a']);
		expect(justificationRepo.save).not.toHaveBeenCalled();
	});

	it('rejects every record when there is no active academic year', async () => {
		academicYearPort.findActiveByTenant.mockResolvedValue(null);
		attendanceRepo.findByIds.mockResolvedValue([record('a')]);

		const response = await failureOf(['a']);

		expect(response.details).toEqual([
			{ recordId: 'a', reason: 'No hay un ciclo lectivo activo' },
		]);
	});

	it('propagates a persistence failure without emitting events', async () => {
		attendanceRepo.findByIds.mockResolvedValue([record('a')]);
		justificationRepo.save.mockRejectedValue(new Error('db down'));

		await expect(handler.execute(command(['a']))).rejects.toThrow('db down');

		expect(events.emit).not.toHaveBeenCalled();
	});
});
