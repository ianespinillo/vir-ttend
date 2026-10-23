import { ATTENDANCE_STATUS, AttendanceStatus, ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import {
	DomainError,
	ForbiddenError,
	NotFoundError,
} from '../../../src/common/errors';
import { JustifyWorkshopAttendanceCommand } from '../../../src/modules/attendance/application/commands/justify-workshop-attendance/justify-workshop-attendance.command';
import { JustifyWorkshopAttendanceHandler } from '../../../src/modules/attendance/application/commands/justify-workshop-attendance/justify-workshop-attendance.handler';
import { AcademicYear } from '../../../src/modules/attendance/domain/entities/academic-year.entity';
import { IAcademicYearPort } from '../../../src/modules/attendance/domain/ports/academic-year.port.interface';
import { IWorkshopCommissionPort } from '../../../src/modules/attendance/domain/ports/workshop-commission.port.interface';
import { IWorkshopJustificationRepository } from '../../../src/modules/attendance/domain/repositories/workshop-justification.repository.interface';
import {
	PRECEPTOR_ID,
	TENANT,
	buildPort,
	buildRepo,
	commission,
	existingRecord,
} from './workshop-attendance.fixtures';

describe('JustifyWorkshopAttendanceHandler', () => {
	let justificationRepo: MockProxy<IWorkshopJustificationRepository>;
	let academicYearPort: MockProxy<IAcademicYearPort>;
	let commissionPort: jest.Mocked<IWorkshopCommissionPort>;

	const setup = (status: AttendanceStatus, found = true) => {
		const record = existingRecord('s1', status);
		const repo = buildRepo(found ? [record] : []);
		const handler = new JustifyWorkshopAttendanceHandler(
			justificationRepo,
			repo,
			commissionPort,
			academicYearPort,
		);
		return { record, repo, handler };
	};

	const command = (
		recordId: string,
		userId = PRECEPTOR_ID,
		role: (typeof ROLES)[keyof typeof ROLES] = ROLES.PRECEPTOR,
		notes?: string,
	) =>
		new JustifyWorkshopAttendanceCommand(
			TENANT,
			userId,
			role,
			recordId,
			'Enfermedad',
			notes,
		);

	beforeEach(() => {
		justificationRepo = mock<IWorkshopJustificationRepository>();
		academicYearPort = mock<IAcademicYearPort>();
		commissionPort = buildPort(commission());
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

	it('justifies an absent record and marks it JUSTIFIED', async () => {
		const { record, repo, handler } = setup(ATTENDANCE_STATUS.ABSENT);

		await handler.execute(
			command(record.id, PRECEPTOR_ID, ROLES.PRECEPTOR, 'Nota'),
		);

		expect(justificationRepo.save).toHaveBeenCalledTimes(1);
		const saved = justificationRepo.save.mock.calls[0][0];
		expect(saved.workshopAttendanceRecordId.getRaw()).toBe(record.id);
		expect(saved.reason.getRaw()).toBe('Enfermedad');
		expect(saved.notes).toBe('Nota');
		expect(saved.createdBy).toBe(PRECEPTOR_ID);
		expect(repo.saved[0][0].status).toBe(ATTENDANCE_STATUS.JUSTIFIED);
	});

	it('justifies a late record', async () => {
		const { record, repo, handler } = setup(ATTENDANCE_STATUS.LATE);

		await handler.execute(command(record.id));

		expect(justificationRepo.save).toHaveBeenCalledTimes(1);
		expect(repo.saved[0][0].status).toBe(ATTENDANCE_STATUS.JUSTIFIED);
	});

	it('saves the justification before the record', async () => {
		const { record, repo, handler } = setup(ATTENDANCE_STATUS.ABSENT);

		await handler.execute(command(record.id));

		expect(justificationRepo.save.mock.invocationCallOrder[0]).toBeLessThan(
			repo.bulkSave.mock.invocationCallOrder[0],
		);
	});

	it('does not touch the record when saving the justification fails', async () => {
		const { record, repo, handler } = setup(ATTENDANCE_STATUS.ABSENT);
		justificationRepo.save.mockRejectedValue(new Error('db down'));

		await expect(handler.execute(command(record.id))).rejects.toThrow('db down');

		expect(repo.bulkSave).not.toHaveBeenCalled();
	});

	it('rejects a present record', async () => {
		const { record, repo, handler } = setup(ATTENDANCE_STATUS.PRESENT);

		const attempt = handler.execute(command(record.id));

		await expect(attempt).rejects.toBeInstanceOf(DomainError);
		await expect(attempt).rejects.toThrow(
			'Solo se pueden justificar inasistencias o tardanzas del ciclo lectivo activo.',
		);
		expect(justificationRepo.save).not.toHaveBeenCalled();
		expect(repo.bulkSave).not.toHaveBeenCalled();
	});

	it('rejects an already justified record', async () => {
		const { record, handler } = setup(ATTENDANCE_STATUS.JUSTIFIED);

		await expect(handler.execute(command(record.id))).rejects.toBeInstanceOf(
			DomainError,
		);
		expect(justificationRepo.save).not.toHaveBeenCalled();
	});

	it('rejects a record outside the active academic year', async () => {
		academicYearPort.findActiveByTenant.mockResolvedValue(
			AcademicYear.reconstitute(
				'ay-0',
				75,
				15,
				new Date('2025-03-01'),
				new Date('2025-12-31'),
			),
		);
		const { record, handler } = setup(ATTENDANCE_STATUS.ABSENT);

		await expect(handler.execute(command(record.id))).rejects.toBeInstanceOf(
			DomainError,
		);
	});

	it('throws NotFoundError when the record does not exist', async () => {
		const { handler } = setup(ATTENDANCE_STATUS.ABSENT, false);

		const attempt = handler.execute(command('missing'));

		await expect(attempt).rejects.toBeInstanceOf(NotFoundError);
		await expect(attempt).rejects.toThrow('Registro de asistencia no encontrado');
		expect(justificationRepo.save).not.toHaveBeenCalled();
	});

	it('throws NotFoundError when there is no active academic year', async () => {
		academicYearPort.findActiveByTenant.mockResolvedValue(null);
		const { record, handler } = setup(ATTENDANCE_STATUS.ABSENT);

		await expect(handler.execute(command(record.id))).rejects.toBeInstanceOf(
			NotFoundError,
		);
	});

	it('forbids a preceptor of another commission', async () => {
		const { record, repo, handler } = setup(ATTENDANCE_STATUS.ABSENT);

		await expect(
			handler.execute(command(record.id, 'other-preceptor')),
		).rejects.toBeInstanceOf(ForbiddenError);
		expect(justificationRepo.save).not.toHaveBeenCalled();
		expect(repo.bulkSave).not.toHaveBeenCalled();
	});

	it('allows an admin of the tenant', async () => {
		const { record, repo, handler } = setup(ATTENDANCE_STATUS.ABSENT);

		await handler.execute(command(record.id, 'admin-1', ROLES.ADMIN));

		expect(justificationRepo.save).toHaveBeenCalledTimes(1);
		expect(repo.saved[0][0].status).toBe(ATTENDANCE_STATUS.JUSTIFIED);
		expect(repo.saved[0][0].editedBy).toBe('admin-1');
	});
});
