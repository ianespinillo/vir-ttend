import { EventEmitter2 } from '@nestjs/event-emitter';
import { ATTENDANCE_STATUS, DAYOFWEEK, ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { DomainError } from '../../../src/common/errors';
import { BulkRegisterWorkshopAttendanceCommand } from '../../../src/modules/attendance/application/commands/bulk-register-workshop-attendance/bulk-register-workshop-attendance.command';
import { BulkRegisterWorkshopAttendanceHandler } from '../../../src/modules/attendance/application/commands/bulk-register-workshop-attendance/bulk-register-workshop-attendance.handler';
import { MarkWorkshopSessionNotHeldCommand } from '../../../src/modules/attendance/application/commands/mark-workshop-session-not-held/mark-workshop-session-not-held.command';
import { MarkWorkshopSessionNotHeldHandler } from '../../../src/modules/attendance/application/commands/mark-workshop-session-not-held/mark-workshop-session-not-held.handler';
import { RegisterWorkshopAttendanceCommand } from '../../../src/modules/attendance/application/commands/register-workshop-attendance/register-workshop-attendance.command';
import { RegisterWorkshopAttendanceHandler } from '../../../src/modules/attendance/application/commands/register-workshop-attendance/register-workshop-attendance.handler';
import { AlertReconciliationService } from '../../../src/modules/attendance/application/services/alert-reconciliation.service';
import {
	WORKSHOP_NOT_SCHEDULED_MESSAGE,
	assertWorkshopScheduledOn,
} from '../../../src/modules/attendance/application/services/workshop-schedule.policy';
import { IUnitOfWorkPort } from '../../../src/modules/attendance/domain/ports/unit-of-work.port.interface';
import { IWorkshopCommissionPort } from '../../../src/modules/attendance/domain/ports/workshop-commission.port.interface';
import {
	DATE,
	PRECEPTOR_ID,
	TENANT,
	buildNotHeldRepo,
	buildPort,
	buildRepo,
	commission,
	existingRecord,
	student,
} from './workshop-attendance.fixtures';

// DATE (2026-03-10) is a Tuesday.
const SCHEDULED = [DAYOFWEEK.TUESDAY];
const UNSCHEDULED = [DAYOFWEEK.THURSDAY];

const portWithDays = (
	days: DAYOFWEEK[],
): jest.Mocked<IWorkshopCommissionPort> => {
	const port = buildPort(commission(), [student('s1'), student('s2')]);
	port.getWorkshopDays.mockResolvedValue(days);
	return port;
};

describe('workshop schedule enforcement', () => {
	const unitOfWork: IUnitOfWorkPort = { run: (work) => work() };
	let emitter: MockProxy<EventEmitter2>;
	beforeEach(() => {
		emitter = mock<EventEmitter2>();
	});

	const buildRegister = (port: IWorkshopCommissionPort, repo = buildRepo()) =>
		new RegisterWorkshopAttendanceHandler(
			port,
			repo,
			unitOfWork,
			emitter,
			buildNotHeldRepo(),
		);
	const registerCommand = (
		status: RegisterWorkshopAttendanceCommand['records'][number]['status'] = ATTENDANCE_STATUS.PRESENT,
	) =>
		new RegisterWorkshopAttendanceCommand(
			TENANT,
			PRECEPTOR_ID,
			ROLES.PRECEPTOR,
			'commission-1',
			DATE,
			[{ studentId: 's1', status }],
		);

	describe('assertWorkshopScheduledOn', () => {
		const check = (days: DAYOFWEEK[], date: Date) =>
			assertWorkshopScheduledOn(portWithDays(days), commission(), date);

		it('queries the workshop days of the commission', async () => {
			const port = portWithDays(SCHEDULED);
			await assertWorkshopScheduledOn(port, commission(), DATE);
			expect(port.getWorkshopDays).toHaveBeenCalledWith('course-1', 1);
		});

		it('rejects a weekday without workshop', async () => {
			await expect(check(UNSCHEDULED, DATE)).rejects.toThrow(
				new DomainError(WORKSHOP_NOT_SCHEDULED_MESSAGE),
			);
		});

		it('rejects a weekend when a schedule is loaded', async () => {
			await expect(
				check(SCHEDULED, new Date('2026-03-14')),
			).rejects.toBeInstanceOf(DomainError);
		});

		it('allows a workshop weekday', async () => {
			await expect(check(SCHEDULED, DATE)).resolves.toBeUndefined();
		});

		it('allows any date when no schedule is loaded', async () => {
			await expect(check([], DATE)).resolves.toBeUndefined();
		});
	});

	describe('RegisterWorkshopAttendanceHandler', () => {
		it('rejects an unscheduled day and saves nothing', async () => {
			const repo = buildRepo();
			const handler = buildRegister(portWithDays(UNSCHEDULED), repo);

			await expect(handler.execute(registerCommand())).rejects.toThrow(
				WORKSHOP_NOT_SCHEDULED_MESSAGE,
			);
			expect(repo.bulkSave).not.toHaveBeenCalled();
			expect(emitter.emit).not.toHaveBeenCalled();
		});

		it('registers on a scheduled day', async () => {
			const repo = buildRepo();
			await buildRegister(portWithDays(SCHEDULED), repo).execute(
				registerCommand(),
			);
			expect(repo.bulkSave).toHaveBeenCalledTimes(1);
		});

		it('registers when the course has no schedule loaded', async () => {
			const repo = buildRepo();
			await buildRegister(portWithDays([]), repo).execute(registerCommand());
			expect(repo.bulkSave).toHaveBeenCalledTimes(1);
		});

		it('also blocks edits of existing records on an unscheduled day', async () => {
			const repo = buildRepo([existingRecord('s1')]);
			const handler = buildRegister(portWithDays(UNSCHEDULED), repo);
			await expect(
				handler.execute(registerCommand(ATTENDANCE_STATUS.ABSENT)),
			).rejects.toBeInstanceOf(DomainError);
			expect(repo.bulkSave).not.toHaveBeenCalled();
		});
	});

	describe('BulkRegisterWorkshopAttendanceHandler', () => {
		const bulkCommand = () =>
			new BulkRegisterWorkshopAttendanceCommand(
				TENANT,
				PRECEPTOR_ID,
				ROLES.PRECEPTOR,
				'commission-1',
				DATE,
				ATTENDANCE_STATUS.PRESENT,
			);
		const buildBulk = (days: DAYOFWEEK[], repo = buildRepo()) => {
			const port = portWithDays(days);
			return new BulkRegisterWorkshopAttendanceHandler(
				port,
				buildRegister(port, repo),
			);
		};

		it('rejects an unscheduled day', async () => {
			const repo = buildRepo();
			await expect(
				buildBulk(UNSCHEDULED, repo).execute(bulkCommand()),
			).rejects.toThrow(WORKSHOP_NOT_SCHEDULED_MESSAGE);
			expect(repo.bulkSave).not.toHaveBeenCalled();
		});

		it('registers everyone on a scheduled day', async () => {
			const repo = buildRepo();
			await buildBulk(SCHEDULED, repo).execute(bulkCommand());
			expect(repo.saved[0]).toHaveLength(2);
		});
	});

	describe('MarkWorkshopSessionNotHeldHandler', () => {
		it('still clears an unscheduled day saved by mistake', async () => {
			const repo = buildRepo([existingRecord('s1'), existingRecord('s2')]);
			const notHeldRepo = buildNotHeldRepo();
			const handler = new MarkWorkshopSessionNotHeldHandler(
				portWithDays(UNSCHEDULED),
				notHeldRepo,
				repo,
				unitOfWork,
				mock<AlertReconciliationService>(),
			);

			const result = await handler.execute(
				new MarkWorkshopSessionNotHeldCommand(
					TENANT,
					PRECEPTOR_ID,
					ROLES.PRECEPTOR,
					'commission-1',
					DATE,
					undefined,
				),
			);

			expect(result).toEqual({ deletedRecords: 2 });
			expect(notHeldRepo.save).toHaveBeenCalledTimes(1);
		});
	});
});
