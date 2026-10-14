import { ForbiddenException } from '@nestjs/common';
import { ATTENDANCE_STATUS, DAYOFWEEK, ROLES } from '@repo/common';
import { GetMyWorkshopCommissionsQueryHandler } from '../../../src/modules/attendance/application/queries/get-my-workshop-commissions/get-my-workshop-commissions.handler';
import { GetMyWorkshopCommissionsQuery } from '../../../src/modules/attendance/application/queries/get-my-workshop-commissions/get-my-workshop-commissions.query';
import { GetWorkshopAttendanceQueryHandler } from '../../../src/modules/attendance/application/queries/get-workshop-attendance/get-workshop-attendance.handler';
import { GetWorkshopAttendanceQuery } from '../../../src/modules/attendance/application/queries/get-workshop-attendance/get-workshop-attendance.query';
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
		);
		await expect(handler.execute(query('other'))).rejects.toThrow(
			ForbiddenException,
		);
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
