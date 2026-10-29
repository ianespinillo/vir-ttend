import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ATTENDANCE_STATUS, ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import {
	DomainError,
	ForbiddenError,
	NotFoundError,
} from '../../../src/common/errors';
import { BulkRegisterWorkshopAttendanceCommand } from '../../../src/modules/attendance/application/commands/bulk-register-workshop-attendance/bulk-register-workshop-attendance.command';
import { BulkRegisterWorkshopAttendanceHandler } from '../../../src/modules/attendance/application/commands/bulk-register-workshop-attendance/bulk-register-workshop-attendance.handler';
import { MarkWorkshopSessionNotHeldCommand } from '../../../src/modules/attendance/application/commands/mark-workshop-session-not-held/mark-workshop-session-not-held.command';
import { MarkWorkshopSessionNotHeldHandler } from '../../../src/modules/attendance/application/commands/mark-workshop-session-not-held/mark-workshop-session-not-held.handler';
import { RegisterWorkshopAttendanceCommand } from '../../../src/modules/attendance/application/commands/register-workshop-attendance/register-workshop-attendance.command';
import { RegisterWorkshopAttendanceHandler } from '../../../src/modules/attendance/application/commands/register-workshop-attendance/register-workshop-attendance.handler';
import { UnmarkWorkshopSessionNotHeldCommand } from '../../../src/modules/attendance/application/commands/unmark-workshop-session-not-held/unmark-workshop-session-not-held.command';
import { UnmarkWorkshopSessionNotHeldHandler } from '../../../src/modules/attendance/application/commands/unmark-workshop-session-not-held/unmark-workshop-session-not-held.handler';
import { GetWorkshopSessionNotHeldQueryHandler } from '../../../src/modules/attendance/application/queries/get-workshop-session-not-held/get-workshop-session-not-held.handler';
import { GetWorkshopSessionNotHeldQuery } from '../../../src/modules/attendance/application/queries/get-workshop-session-not-held/get-workshop-session-not-held.query';
import { WORKSHOP_SESSION_NOT_HELD_MESSAGE } from '../../../src/modules/attendance/application/services/workshop-session-held.policy';
import { IUnitOfWorkPort } from '../../../src/modules/attendance/domain/ports/unit-of-work.port.interface';
import {
	DATE,
	PRECEPTOR_ID,
	TENANT,
	buildNotHeldRepo,
	buildPort,
	buildRepo,
	commission,
	existingRecord,
	notHeldMarker,
	student,
} from './workshop-attendance.fixtures';

describe('workshop session not held', () => {
	let unitOfWork: MockProxy<IUnitOfWorkPort>;

	beforeEach(() => {
		unitOfWork = mock<IUnitOfWorkPort>();
		unitOfWork.run.mockImplementation(async (work) => work());
	});

	describe('MarkWorkshopSessionNotHeldHandler', () => {
		const command = (
			reason?: string,
			userId = PRECEPTOR_ID,
			role: MarkWorkshopSessionNotHeldCommand['role'] = ROLES.PRECEPTOR,
		) =>
			new MarkWorkshopSessionNotHeldCommand(
				TENANT,
				userId,
				role,
				'commission-1',
				DATE,
				reason,
			);
		const build = (
			info = commission(),
			repo = buildRepo([existingRecord('s1'), existingRecord('s2')]),
			notHeldRepo = buildNotHeldRepo(),
		) => ({
			repo,
			notHeldRepo,
			handler: new MarkWorkshopSessionNotHeldHandler(
				buildPort(info),
				notHeldRepo,
				repo,
				unitOfWork,
			),
		});

		it('deletes the workshop records of the day and saves the marker', async () => {
			const { handler, repo, notHeldRepo } = build();

			const result = await handler.execute(command('Ausencia del docente'));

			expect(result).toEqual({ deletedRecords: 2 });
			expect(repo.deleteByCommissionAndDate).toHaveBeenCalledWith(
				'commission-1',
				DATE,
			);
			expect(notHeldRepo.save).toHaveBeenCalledTimes(1);
			const saved = notHeldRepo.save.mock.calls[0][0];
			expect(saved.tenantId).toBe(TENANT);
			expect(saved.workshopCommissionId).toBe('commission-1');
			expect(saved.date).toBe(DATE);
			expect(saved.reason).toBe('Ausencia del docente');
			expect(saved.createdBy).toBe(PRECEPTOR_ID);
		});

		it('runs the deletion and the marker inside one unit of work', async () => {
			const { handler } = build();

			await handler.execute(command());

			expect(unitOfWork.run).toHaveBeenCalledTimes(1);
		});

		it('stores a blank reason as no reason', async () => {
			const { handler, notHeldRepo } = build();

			await handler.execute(command('   '));

			expect(notHeldRepo.save.mock.calls[0][0].reason).toBeUndefined();
		});

		it('is idempotent: an already marked day only gets its reason updated', async () => {
			const existing = notHeldMarker('Viejo');
			const { handler, notHeldRepo } = build(
				commission(),
				buildRepo(),
				buildNotHeldRepo(existing),
			);

			const result = await handler.execute(command('Nuevo'));

			expect(result).toEqual({ deletedRecords: 0 });
			expect(notHeldRepo.save).toHaveBeenCalledTimes(1);
			expect(notHeldRepo.save).toHaveBeenCalledWith(existing);
			expect(existing.reason).toBe('Nuevo');
		});

		it('does not save again when the day is already marked with the same reason', async () => {
			const { handler, notHeldRepo } = build(
				commission(),
				buildRepo(),
				buildNotHeldRepo(notHeldMarker('Igual')),
			);

			await handler.execute(command('Igual'));

			expect(notHeldRepo.save).not.toHaveBeenCalled();
		});

		it('converges when a concurrent mark wins: the retry finds the marker and is a no-op', async () => {
			// Mirrors the adapter: a unique violation re-runs the work once.
			unitOfWork.run.mockImplementation(async (work) => {
				try {
					return await work();
				} catch (error) {
					if (!(error instanceof UniqueConstraintViolationException)) throw error;
					return work();
				}
			});
			const { handler, notHeldRepo } = build(commission(), buildRepo());
			notHeldRepo.findByCommissionAndDate
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce(notHeldMarker('Paro'));
			notHeldRepo.save.mockRejectedValueOnce(
				new UniqueConstraintViolationException(new Error('duplicate key')),
			);

			const result = await handler.execute(command('Paro'));

			expect(result).toEqual({ deletedRecords: 0 });
			expect(notHeldRepo.save).toHaveBeenCalledTimes(1);
			expect(notHeldRepo.findByCommissionAndDate).toHaveBeenCalledTimes(2);
		});

		it('lets an admin mark any commission of the tenant', async () => {
			const { handler, notHeldRepo } = build();

			await handler.execute(command(undefined, 'admin-1', ROLES.ADMIN));

			expect(notHeldRepo.save).toHaveBeenCalledTimes(1);
		});

		it('forbids a preceptor assigned to another commission', async () => {
			const { handler, repo, notHeldRepo } = build();

			await expect(
				handler.execute(command(undefined, 'other-preceptor')),
			).rejects.toBeInstanceOf(ForbiddenError);
			expect(repo.deleteByCommissionAndDate).not.toHaveBeenCalled();
			expect(notHeldRepo.save).not.toHaveBeenCalled();
		});

		it('forbids a commission of another tenant', async () => {
			const { handler, repo } = build(commission({ tenantId: 'other-tenant' }));

			await expect(handler.execute(command())).rejects.toBeInstanceOf(
				ForbiddenError,
			);
			expect(repo.deleteByCommissionAndDate).not.toHaveBeenCalled();
		});

		it('reports a missing commission as not found', async () => {
			const { handler, repo } = build(null as never);

			await expect(handler.execute(command())).rejects.toBeInstanceOf(
				NotFoundError,
			);
			expect(repo.deleteByCommissionAndDate).not.toHaveBeenCalled();
		});
	});

	describe('UnmarkWorkshopSessionNotHeldHandler', () => {
		const command = (userId = PRECEPTOR_ID) =>
			new UnmarkWorkshopSessionNotHeldCommand(
				TENANT,
				userId,
				ROLES.PRECEPTOR,
				'commission-1',
				DATE,
			);

		it('removes the marker without restoring any record', async () => {
			const notHeldRepo = buildNotHeldRepo(notHeldMarker());
			const repo = buildRepo();

			await new UnmarkWorkshopSessionNotHeldHandler(
				buildPort(commission()),
				notHeldRepo,
			).execute(command());

			expect(notHeldRepo.delete).toHaveBeenCalledWith('commission-1', DATE);
			expect(repo.bulkSave).not.toHaveBeenCalled();
		});

		it('forbids a preceptor assigned to another commission', async () => {
			const notHeldRepo = buildNotHeldRepo(notHeldMarker());

			await expect(
				new UnmarkWorkshopSessionNotHeldHandler(
					buildPort(commission()),
					notHeldRepo,
				).execute(command('other-preceptor')),
			).rejects.toBeInstanceOf(ForbiddenError);
			expect(notHeldRepo.delete).not.toHaveBeenCalled();
		});

		it('reports a missing commission as not found', async () => {
			const notHeldRepo = buildNotHeldRepo();

			await expect(
				new UnmarkWorkshopSessionNotHeldHandler(
					buildPort(null),
					notHeldRepo,
				).execute(command()),
			).rejects.toBeInstanceOf(NotFoundError);
			expect(notHeldRepo.delete).not.toHaveBeenCalled();
		});
	});

	describe('GetWorkshopSessionNotHeldQueryHandler', () => {
		const run = (
			notHeldRepo = buildNotHeldRepo(),
			info: ReturnType<typeof commission> | null = commission(),
			userId = PRECEPTOR_ID,
		) =>
			new GetWorkshopSessionNotHeldQueryHandler(
				buildPort(info),
				notHeldRepo,
			).execute(
				new GetWorkshopSessionNotHeldQuery(
					TENANT,
					userId,
					ROLES.PRECEPTOR,
					'commission-1',
					DATE,
				),
			);

		it('answers not held with the reason when the day is marked', async () => {
			expect(await run(buildNotHeldRepo(notHeldMarker('Paro')))).toEqual({
				notHeld: true,
				reason: 'Paro',
			});
		});

		it('answers held when the day is not marked', async () => {
			const result = await run();

			expect(result.notHeld).toBe(false);
			expect(result.reason).toBeUndefined();
		});

		it('forbids a preceptor assigned to another commission', async () => {
			await expect(
				run(buildNotHeldRepo(), commission(), 'other-preceptor'),
			).rejects.toBeInstanceOf(ForbiddenError);
		});

		it('reports a missing commission as not found', async () => {
			await expect(run(buildNotHeldRepo(), null)).rejects.toBeInstanceOf(
				NotFoundError,
			);
		});
	});

	describe('registering on a marked day', () => {
		const students = [student('s1'), student('s2')];
		let emitter: MockProxy<EventEmitter2>;

		beforeEach(() => {
			emitter = mock<EventEmitter2>();
		});

		const buildRegister = (notHeldRepo = buildNotHeldRepo(notHeldMarker())) => {
			const port = buildPort(commission(), students);
			const repo = buildRepo();
			const register = new RegisterWorkshopAttendanceHandler(
				port,
				repo,
				unitOfWork,
				emitter,
				notHeldRepo,
			);
			return { port, repo, register };
		};

		const expectBlocked = async (
			attempt: Promise<unknown>,
			repo: ReturnType<typeof buildRepo>,
		) => {
			await expect(attempt).rejects.toBeInstanceOf(DomainError);
			await expect(attempt).rejects.toThrow(WORKSHOP_SESSION_NOT_HELD_MESSAGE);
			expect(repo.bulkSave).not.toHaveBeenCalled();
			expect(emitter.emit).not.toHaveBeenCalled();
		};

		describe('RegisterWorkshopAttendanceHandler', () => {
			const command = () =>
				new RegisterWorkshopAttendanceCommand(
					TENANT,
					PRECEPTOR_ID,
					ROLES.PRECEPTOR,
					'commission-1',
					DATE,
					[{ studentId: 's1', status: ATTENDANCE_STATUS.ABSENT }],
				);

			it('throws when the day is marked as not held', async () => {
				const { register, repo } = buildRegister();

				await expectBlocked(register.execute(command()), repo);
			});

			it('registers when the day is held', async () => {
				const { register, repo } = buildRegister(buildNotHeldRepo());

				await register.execute(command());

				expect(repo.bulkSave).toHaveBeenCalledTimes(1);
			});

			it('checks the marker inside the unit of work', async () => {
				const notHeldRepo = buildNotHeldRepo(notHeldMarker());
				const { register } = buildRegister(notHeldRepo);
				unitOfWork.run.mockImplementation(async () => {
					throw new Error('unit of work entered');
				});

				await expect(register.execute(command())).rejects.toThrow(
					'unit of work entered',
				);
				expect(notHeldRepo.findByCommissionAndDate).not.toHaveBeenCalled();
			});
		});

		describe('BulkRegisterWorkshopAttendanceHandler', () => {
			const run = (register: RegisterWorkshopAttendanceHandler) =>
				new BulkRegisterWorkshopAttendanceHandler(
					buildPort(commission(), students),
					register,
				).execute(
					new BulkRegisterWorkshopAttendanceCommand(
						TENANT,
						PRECEPTOR_ID,
						ROLES.PRECEPTOR,
						'commission-1',
						DATE,
						ATTENDANCE_STATUS.PRESENT,
					),
				);

			it('throws when the day is marked as not held', async () => {
				const { register, repo } = buildRegister();

				await expectBlocked(run(register), repo);
			});

			it('registers when the day is held', async () => {
				const { register, repo } = buildRegister(buildNotHeldRepo());

				await run(register);

				expect(repo.bulkSave).toHaveBeenCalledTimes(1);
			});
		});
	});
});
