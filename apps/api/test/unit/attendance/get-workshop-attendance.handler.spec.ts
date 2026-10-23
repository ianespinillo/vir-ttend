import { ATTENDANCE_STATUS, DAYOFWEEK, ROLES } from '@repo/common';
import { mock } from 'jest-mock-extended';
import { ForbiddenError } from '../../../src/common/errors';
import { GetMyWorkshopCommissionsQueryHandler } from '../../../src/modules/attendance/application/queries/get-my-workshop-commissions/get-my-workshop-commissions.handler';
import { GetMyWorkshopCommissionsQuery } from '../../../src/modules/attendance/application/queries/get-my-workshop-commissions/get-my-workshop-commissions.query';
import { GetWorkshopAttendanceQueryHandler } from '../../../src/modules/attendance/application/queries/get-workshop-attendance/get-workshop-attendance.handler';
import { GetWorkshopAttendanceQuery } from '../../../src/modules/attendance/application/queries/get-workshop-attendance/get-workshop-attendance.query';
import { WorkshopJustification } from '../../../src/modules/attendance/domain/entities/workshop-justification.entity';
import { IWorkshopJustificationRepository } from '../../../src/modules/attendance/domain/repositories/workshop-justification.repository.interface';
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

describe('GetWorkshopAttendanceQueryHandler', () => {
	const noJustifications = () => {
		const repo = mock<IWorkshopJustificationRepository>();
		repo.findByRecords.mockResolvedValue([]);
		return repo;
	};
	const query = (userId = PRECEPTOR_ID) =>
		new GetWorkshopAttendanceQuery(
			TENANT,
			userId,
			ROLES.PRECEPTOR,
			'commission-1',
			DATE,
		);

	it('returns null status for students without a record and keeps port order', async () => {
		const handler = new GetWorkshopAttendanceQueryHandler(
			buildPort(commission(), [student('s1', 'Ana'), student('s2', 'Beto')]),
			buildRepo([existingRecord('s2', ATTENDANCE_STATUS.ABSENT)]),
			noJustifications(),
		);

		const result = await handler.execute(query());

		expect(result.commissionCode).toBe('141');
		expect(result.records.map((r) => [r.studentName, r.status])).toEqual([
			['Ana', null],
			['Beto', ATTENDANCE_STATUS.ABSENT],
		]);
		expect(result.records[0].id).toBeNull();
	});

	it('rejects a preceptor who is not assigned to the commission', async () => {
		const handler = new GetWorkshopAttendanceQueryHandler(
			buildPort(commission()),
			buildRepo(),
			noJustifications(),
		);
		await expect(handler.execute(query('other'))).rejects.toThrow(ForbiddenError);
	});

	it('attaches the justification only to justified records, loaded in one query', async () => {
		const justified = existingRecord('s1', ATTENDANCE_STATUS.JUSTIFIED);
		const absent = existingRecord('s2', ATTENDANCE_STATUS.ABSENT);
		const justification = WorkshopJustification.create({
			workshopAttendanceRecordId: justified.id,
			reason: 'Enfermedad',
			notes: 'Certificado',
			createdBy: PRECEPTOR_ID,
		});
		const justificationRepo = mock<IWorkshopJustificationRepository>();
		justificationRepo.findByRecords.mockResolvedValue([justification]);
		const handler = new GetWorkshopAttendanceQueryHandler(
			buildPort(commission(), [
				student('s1', 'Ana'),
				student('s2', 'Beto'),
				student('s3', 'Cora'),
			]),
			buildRepo([justified, absent]),
			justificationRepo,
		);

		const result = await handler.execute(query());

		expect(justificationRepo.findByRecords).toHaveBeenCalledTimes(1);
		expect(justificationRepo.findByRecords).toHaveBeenCalledWith([justified.id]);
		expect(result.records[0].justification).toMatchObject({
			id: justification.id,
			reason: 'Enfermedad',
			notes: 'Certificado',
			createdBy: PRECEPTOR_ID,
		});
		expect(result.records[1].justification).toBeUndefined();
		expect(result.records[2].justification).toBeUndefined();
	});
});

describe('GetMyWorkshopCommissionsQueryHandler', () => {
	// 2026-03-10 is a Tuesday (UTC).
	const tuesday = new Date('2026-03-10');
	const run = async (days: DAYOFWEEK[], date = tuesday) => {
		const port = buildPort(commission());
		port.getWorkshopDays.mockResolvedValue(days);
		const handler = new GetMyWorkshopCommissionsQueryHandler(port);
		const result = await handler.execute(
			new GetMyWorkshopCommissionsQuery(
				TENANT,
				PRECEPTOR_ID,
				ROLES.PRECEPTOR,
				date,
			),
		);
		return { port, result };
	};

	it('flags hasWorkshopToday when a workshop slot falls on that weekday', async () => {
		const { port, result } = await run([DAYOFWEEK.TUESDAY]);
		expect(port.getWorkshopDays).toHaveBeenCalledWith('course-1', 1);
		expect(result[0]).toMatchObject({
			code: '141',
			courseName: '1° 4°',
			hasWorkshopToday: true,
		});
	});

	it('is false when the commission has workshop only on other days', async () => {
		const { result } = await run([DAYOFWEEK.MONDAY]);
		expect(result[0].hasWorkshopToday).toBe(false);
	});

	it('is false on a weekend', async () => {
		const { result } = await run([DAYOFWEEK.TUESDAY], new Date('2026-03-14'));
		expect(result[0].hasWorkshopToday).toBe(false);
	});

	it('lists every tenant commission for an admin', async () => {
		const port = buildPort(commission());
		const handler = new GetMyWorkshopCommissionsQueryHandler(port);
		await handler.execute(
			new GetMyWorkshopCommissionsQuery(TENANT, 'admin-1', ROLES.ADMIN, tuesday),
		);
		expect(port.findByTenant).toHaveBeenCalledWith(TENANT);
		expect(port.findByPreceptor).not.toHaveBeenCalled();
	});
});
