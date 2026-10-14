import { ATTENDANCE_STATUS, isLateStatus } from '@repo/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BulkRegisterAttendanceRequestDto } from '../../../src/modules/attendance/application/dtos/bulk-register-attendance.request.dto';
import { RegisterDailyAttendanceRequestDto } from '../../../src/modules/attendance/application/dtos/register-daily-attendance.request.dto';
import {
	BulkRegisterWorkshopAttendanceRequestDto,
	RegisterWorkshopAttendanceRequestDto,
} from '../../../src/modules/attendance/application/dtos/workshop-attendance.request.dto';

const UUID = '1c2d3e4f-5a6b-4c8d-9e0f-1a2b3c4d5e6f';

describe('late beyond tolerance status', () => {
	it('is stored as late_beyond_tolerance', () => {
		expect(ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE).toBe('late_beyond_tolerance');
	});

	it('is a late status, like LATE', () => {
		expect(isLateStatus(ATTENDANCE_STATUS.LATE)).toBe(true);
		expect(isLateStatus(ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE)).toBe(true);
		expect(isLateStatus(ATTENDANCE_STATUS.ABSENT)).toBe(false);
		expect(isLateStatus(undefined)).toBe(false);
	});

	it('is accepted by the daily attendance request', async () => {
		const dto = plainToInstance(RegisterDailyAttendanceRequestDto, {
			courseId: UUID,
			date: '2026-03-10',
			records: [
				{ studentId: UUID, status: ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE },
			],
		});
		expect(await validate(dto)).toHaveLength(0);
	});

	it('is accepted by the daily bulk request', async () => {
		const dto = plainToInstance(BulkRegisterAttendanceRequestDto, {
			courseId: UUID,
			date: '2026-03-10',
			defaultStatus: ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE,
		});
		expect(await validate(dto)).toHaveLength(0);
	});

	it('is accepted by the workshop attendance request', async () => {
		const dto = plainToInstance(RegisterWorkshopAttendanceRequestDto, {
			commissionId: UUID,
			date: '2026-03-10',
			records: [
				{ studentId: UUID, status: ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE },
			],
		});
		expect(await validate(dto)).toHaveLength(0);
	});

	it('is accepted by the workshop bulk request', async () => {
		const dto = plainToInstance(BulkRegisterWorkshopAttendanceRequestDto, {
			commissionId: UUID,
			date: '2026-03-10',
			status: ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE,
		});
		expect(await validate(dto)).toHaveLength(0);
	});

	it('still rejects an unknown status', async () => {
		const dto = plainToInstance(RegisterWorkshopAttendanceRequestDto, {
			commissionId: UUID,
			date: '2026-03-10',
			records: [{ studentId: UUID, status: 'very_late' }],
		});
		expect((await validate(dto)).length).toBeGreaterThan(0);
	});
});
