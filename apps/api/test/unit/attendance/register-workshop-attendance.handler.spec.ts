import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ATTENDANCE_STATUS, ROLES } from '@repo/common';
import { BulkRegisterWorkshopAttendanceCommand } from '../../../src/modules/attendance/application/commands/bulk-register-workshop-attendance/bulk-register-workshop-attendance.command';
import { BulkRegisterWorkshopAttendanceHandler } from '../../../src/modules/attendance/application/commands/bulk-register-workshop-attendance/bulk-register-workshop-attendance.handler';
import { RegisterWorkshopAttendanceCommand } from '../../../src/modules/attendance/application/commands/register-workshop-attendance/register-workshop-attendance.command';
import { RegisterWorkshopAttendanceHandler } from '../../../src/modules/attendance/application/commands/register-workshop-attendance/register-workshop-attendance.handler';
import { IUnitOfWorkPort } from '../../../src/modules/attendance/domain/ports/unit-of-work.port.interface';
import {
	DATE,
	PRECEPTOR_ID,
	TENANT,
	buildPort,
	buildRepo,
	commission,
	existingRecord,
	student,
} from './workshop-attendance.fixtures';

const unitOfWork: IUnitOfWorkPort = { run: (work) => work() };
const register = (
	records: RegisterWorkshopAttendanceCommand['records'],
	userId = PRECEPTOR_ID,
) =>
	new RegisterWorkshopAttendanceCommand(
		TENANT,
		userId,
		ROLES.PRECEPTOR,
		'commission-1',
		DATE,
		records,
	);

describe('RegisterWorkshopAttendanceHandler', () => {
	const students = [student('s1'), student('s2')];

	it('creates a record, then updates the same (commission, student, date)', async () => {
		const repo = buildRepo();
		const handler = new RegisterWorkshopAttendanceHandler(
			buildPort(commission(), students),
			repo,
			unitOfWork,
		);

		await handler.execute(
			register([{ studentId: 's1', status: ATTENDANCE_STATUS.PRESENT }]),
		);
		const [created] = repo.saved[0];
		expect(created.status).toBe(ATTENDANCE_STATUS.PRESENT);
		expect(created.workshopCommissionId).toBe('commission-1');
		expect(created.courseId).toBe('course-1');

		await handler.execute(
			register([{ studentId: 's1', status: ATTENDANCE_STATUS.ABSENT }]),
		);
		const [updated] = repo.saved[1];
		expect(updated.id).toBe(created.id);
		expect(updated.status).toBe(ATTENDANCE_STATUS.ABSENT);
	});

	it('does not save when nothing changed', async () => {
		const repo = buildRepo([existingRecord('s1')]);
		const handler = new RegisterWorkshopAttendanceHandler(
			buildPort(commission(), students),
			repo,
			unitOfWork,
		);
		await handler.execute(
			register([{ studentId: 's1', status: ATTENDANCE_STATUS.PRESENT }]),
		);
		expect(repo.bulkSave).not.toHaveBeenCalled();
	});

	it('rejects students outside the commission naming them, saving nothing', async () => {
		const repo = buildRepo();
		const handler = new RegisterWorkshopAttendanceHandler(
			buildPort(commission(), students),
			repo,
			unitOfWork,
		);
		const attempt = handler.execute(
			register([
				{ studentId: 's1', status: ATTENDANCE_STATUS.PRESENT },
				{ studentId: 'intruder', status: ATTENDANCE_STATUS.PRESENT },
			]),
		);
		await expect(attempt).rejects.toThrow(BadRequestException);
		await expect(attempt).rejects.toThrow(/intruder/);
		expect(repo.bulkSave).not.toHaveBeenCalled();
	});

	it('rejects a preceptor who is not assigned to the commission', async () => {
		const handler = new RegisterWorkshopAttendanceHandler(
			buildPort(commission(), students),
			buildRepo(),
			unitOfWork,
		);
		await expect(
			handler.execute(
				register([{ studentId: 's1', status: ATTENDANCE_STATUS.PRESENT }], 'other'),
			),
		).rejects.toThrow(ForbiddenException);
	});
});

describe('BulkRegisterWorkshopAttendanceHandler', () => {
	it('marks only the active students of the commission', async () => {
		const repo = buildRepo();
		const port = buildPort(commission(), [student('s1'), student('s2')]);
		const handler = new BulkRegisterWorkshopAttendanceHandler(
			port,
			new RegisterWorkshopAttendanceHandler(port, repo, unitOfWork),
		);

		await handler.execute(
			new BulkRegisterWorkshopAttendanceCommand(
				TENANT,
				PRECEPTOR_ID,
				ROLES.PRECEPTOR,
				'commission-1',
				DATE,
				ATTENDANCE_STATUS.LATE,
			),
		);

		expect(port.getActiveStudents).toHaveBeenCalledWith('commission-1');
		expect(repo.saved[0].map((r) => r.studentId).sort()).toEqual(['s1', 's2']);
		expect(repo.saved[0].every((r) => r.status === ATTENDANCE_STATUS.LATE)).toBe(
			true,
		);
	});
});
