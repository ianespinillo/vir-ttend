import { UnprocessableEntityException } from '@nestjs/common';
import { ATTENDANCE_STATUS, ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { BulkJustifyWorkshopAttendanceCommand } from '../../../src/modules/attendance/application/commands/bulk-justify-workshop-attendance/bulk-justify-workshop-attendance.command';
import { BulkJustifyWorkshopAttendanceHandler } from '../../../src/modules/attendance/application/commands/bulk-justify-workshop-attendance/bulk-justify-workshop-attendance.handler';
import { AcademicYear } from '../../../src/modules/attendance/domain/entities/academic-year.entity';
import { WorkshopAttendanceRecord } from '../../../src/modules/attendance/domain/entities/workshop-attendance-record.entity';
import { IAcademicYearPort } from '../../../src/modules/attendance/domain/ports/academic-year.port.interface';
import { IUnitOfWorkPort } from '../../../src/modules/attendance/domain/ports/unit-of-work.port.interface';
import { IWorkshopAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/workshop-attendance-record.repository.interface';
import { IWorkshopJustificationRepository } from '../../../src/modules/attendance/domain/repositories/workshop-justification.repository.interface';
import {
	DATE,
	PRECEPTOR_ID,
	TENANT,
	buildPort,
	commission,
	existingRecord,
} from './workshop-attendance.fixtures';

describe('BulkJustifyWorkshopAttendanceHandler', () => {
	let justificationRepo: MockProxy<IWorkshopJustificationRepository>;
	let attendanceRepo: MockProxy<IWorkshopAttendanceRecordRepository>;
	let academicYearPort: MockProxy<IAcademicYearPort>;
	let unitOfWork: MockProxy<IUnitOfWorkPort>;
	let handler: BulkJustifyWorkshopAttendanceHandler;

	const setup = (records: WorkshopAttendanceRecord[]) => {
		attendanceRepo.findByIds.mockResolvedValue(records);
		handler = new BulkJustifyWorkshopAttendanceHandler(
			justificationRepo,
			attendanceRepo,
			buildPort(commission()),
			academicYearPort,
			unitOfWork,
		);
	};

	const command = (
		ids: string[],
		userId = PRECEPTOR_ID,
		role: (typeof ROLES)[keyof typeof ROLES] = ROLES.PRECEPTOR,
	) =>
		new BulkJustifyWorkshopAttendanceCommand(
			TENANT,
			userId,
			role,
			ids,
			'Enfermedad',
			'Nota',
		);

	const failureOf = async (cmd: BulkJustifyWorkshopAttendanceCommand) => {
		const error = await handler.execute(cmd).catch((e) => e);
		expect(error).toBeInstanceOf(UnprocessableEntityException);
		return (error as UnprocessableEntityException).getResponse() as {
			details: { recordId: string; reason: string }[];
		};
	};

	beforeEach(() => {
		justificationRepo = mock<IWorkshopJustificationRepository>();
		attendanceRepo = mock<IWorkshopAttendanceRecordRepository>();
		academicYearPort = mock<IAcademicYearPort>();
		unitOfWork = mock<IUnitOfWorkPort>();
		unitOfWork.run.mockImplementation((work) => work());
		// DATE in the fixtures is 2026-03-10.
		academicYearPort.findActiveByTenant.mockResolvedValue(
			AcademicYear.reconstitute(
				'ay-1',
				75,
				15,
				new Date('2026-03-01'),
				new Date('2026-12-31'),
			),
		);
	});

	it('justifies every record in one unit of work', async () => {
		const a = existingRecord('s1', ATTENDANCE_STATUS.ABSENT);
		const b = existingRecord('s2', ATTENDANCE_STATUS.LATE);
		setup([a, b]);

		const result = await handler.execute(command([a.id, b.id]));

		expect(result).toEqual({ justified: 2 });
		expect(unitOfWork.run).toHaveBeenCalledTimes(1);
		expect(justificationRepo.save).toHaveBeenCalledTimes(2);
		const saved = justificationRepo.save.mock.calls.map(([j]) => j);
		expect(saved.map((j) => j.workshopAttendanceRecordId.getRaw())).toEqual([
			a.id,
			b.id,
		]);
		expect(saved.every((j) => j.createdBy === PRECEPTOR_ID)).toBe(true);
		expect(saved.every((j) => j.notes === 'Nota')).toBe(true);
		expect(attendanceRepo.bulkSave).toHaveBeenCalledTimes(1);
		expect(attendanceRepo.bulkSave.mock.calls[0][0]).toEqual([a, b]);
		expect(a.status).toBe(ATTENDANCE_STATUS.JUSTIFIED);
		expect(b.status).toBe(ATTENDANCE_STATUS.JUSTIFIED);
	});

	it('saves nothing when one record is present and names it', async () => {
		const ok = existingRecord('s1', ATTENDANCE_STATUS.ABSENT);
		const present = existingRecord('s2', ATTENDANCE_STATUS.PRESENT);
		setup([ok, present]);

		const response = await failureOf(command([ok.id, present.id]));

		expect(response.details).toEqual([
			{
				recordId: present.id,
				reason:
					'Solo se pueden justificar inasistencias o tardanzas del ciclo lectivo activo.',
			},
		]);
		expect(unitOfWork.run).not.toHaveBeenCalled();
		expect(justificationRepo.save).not.toHaveBeenCalled();
		expect(attendanceRepo.bulkSave).not.toHaveBeenCalled();
		expect(ok.status).toBe(ATTENDANCE_STATUS.ABSENT);
	});

	it('names a missing record', async () => {
		const ok = existingRecord('s1', ATTENDANCE_STATUS.ABSENT);
		setup([ok]);

		const response = await failureOf(command([ok.id, 'ghost']));

		expect(response.details).toEqual([
			{ recordId: 'ghost', reason: 'Registro de asistencia no encontrado' },
		]);
		expect(justificationRepo.save).not.toHaveBeenCalled();
	});

	it('names an already justified record', async () => {
		const done = existingRecord('s1', ATTENDANCE_STATUS.JUSTIFIED);
		setup([done]);

		const response = await failureOf(command([done.id]));

		expect(response.details.map((d) => d.recordId)).toEqual([done.id]);
	});

	it('rejects the whole batch when the preceptor does not own the commission', async () => {
		const a = existingRecord('s1', ATTENDANCE_STATUS.ABSENT);
		setup([a]);

		const response = await failureOf(command([a.id], 'other-preceptor'));

		expect(response.details).toEqual([
			{
				recordId: a.id,
				reason: 'No tiene permiso para gestionar la asistencia de esta comisión',
			},
		]);
		expect(justificationRepo.save).not.toHaveBeenCalled();
		expect(attendanceRepo.bulkSave).not.toHaveBeenCalled();
	});

	it('lets an admin justify records of any commission of the tenant', async () => {
		const a = existingRecord('s1', ATTENDANCE_STATUS.ABSENT);
		setup([a]);

		const result = await handler.execute(command([a.id], 'admin-1', ROLES.ADMIN));

		expect(result).toEqual({ justified: 1 });
		expect(a.editedBy).toBe('admin-1');
	});

	it('treats a record of another tenant as not found', async () => {
		const foreign = WorkshopAttendanceRecord.create({
			tenantId: 'other-tenant',
			workshopCommissionId: 'commission-1',
			courseId: 'course-1',
			studentId: 's1',
			date: DATE,
			status: ATTENDANCE_STATUS.ABSENT,
			editedBy: PRECEPTOR_ID,
		});
		setup([foreign]);

		const response = await failureOf(command([foreign.id]));

		expect(response.details[0].reason).toBe(
			'Registro de asistencia no encontrado',
		);
	});

	it('rejects records when there is no active academic year', async () => {
		academicYearPort.findActiveByTenant.mockResolvedValue(null);
		const a = existingRecord('s1', ATTENDANCE_STATUS.ABSENT);
		setup([a]);

		const response = await failureOf(command([a.id]));

		expect(response.details[0].reason).toBe('No hay un ciclo lectivo activo');
	});
});
