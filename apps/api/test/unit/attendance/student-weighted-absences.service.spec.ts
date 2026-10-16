import { ATTENDANCE_STATUS, DAYOFWEEK } from '@repo/common';
import { NotFoundError } from '../../../src/common/errors';
import { StudentWeightedAbsencesService } from '../../../src/modules/attendance/application/services/student-weighted-absences.service';
import { AcademicYear } from '../../../src/modules/attendance/domain/entities/academic-year.entity';
import { AttendanceRecord } from '../../../src/modules/attendance/domain/entities/attendance-record.entity';
import { WorkshopAttendanceRecord } from '../../../src/modules/attendance/domain/entities/workshop-attendance-record.entity';

const utc = (day: string) => new Date(`${day}T00:00:00.000Z`);
// 2026-03-09 is a Monday.
const MON = utc('2026-03-09');
const TUE = utc('2026-03-10');
const WED = utc('2026-03-11');
const FRI = utc('2026-03-13');

describe('StudentWeightedAbsencesService', () => {
	const year = AcademicYear.reconstitute(
		'year-1',
		25,
		20,
		utc('2026-03-02'),
		utc('2026-12-18'),
	);

	const dailyRecord = (date: Date, status: AttendanceRecord['status']) =>
		AttendanceRecord.reconstitute({
			id: `d-${date.toISOString()}`,
			tenantId: 't',
			studentId: 'student-1',
			courseId: 'course-1',
			date,
			status,
			editedBy: 'u',
			editedAt: date,
			createdAt: date,
		});

	const workshopRecord = (
		date: Date,
		status: WorkshopAttendanceRecord['status'],
	) =>
		WorkshopAttendanceRecord.reconstitute({
			id: `w-${date.toISOString()}`,
			tenantId: 't',
			workshopCommissionId: 'commission-1',
			courseId: 'course-1',
			studentId: 'student-1',
			date,
			status,
			editedBy: 'u',
			editedAt: date,
			createdAt: date,
		});

	function build(opts: {
		daily?: AttendanceRecord[];
		workshop?: WorkshopAttendanceRecord[];
		commission?: { courseId: string; number: number } | null;
		workshopDays?: DAYOFWEEK[];
	}) {
		const attendanceRepo = {
			findDailyByStudentAndDateRange: jest
				.fn()
				.mockResolvedValue(opts.daily ?? []),
		};
		const workshopRepo = {
			findByStudentAndDateRange: jest.fn().mockResolvedValue(opts.workshop ?? []),
		};
		const academicYearPort = { findById: jest.fn().mockResolvedValue(year) };
		const commissionPort = {
			findByStudent: jest.fn().mockResolvedValue(opts.commission ?? null),
			getWorkshopDays: jest.fn().mockResolvedValue(opts.workshopDays ?? []),
		};
		const service = new StudentWeightedAbsencesService(
			attendanceRepo as never,
			workshopRepo as never,
			academicYearPort as never,
			commissionPort as never,
		);
		return {
			service,
			attendanceRepo,
			workshopRepo,
			academicYearPort,
			commissionPort,
		};
	}

	it('aggregates daily and workshop records with the cap and breakdown', async () => {
		const { service } = build({
			daily: [
				dailyRecord(MON, ATTENDANCE_STATUS.ABSENT),
				dailyRecord(TUE, ATTENDANCE_STATUS.ABSENT),
				dailyRecord(WED, ATTENDANCE_STATUS.LATE),
			],
			workshop: [workshopRecord(MON, ATTENDANCE_STATUS.ABSENT)],
		});

		const result = await service.getStudentWeightedAbsences(
			'student-1',
			'year-1',
		);

		// Monday: 0.5 daily + 0.5 workshop; Tuesday: 1; Wednesday: 0.25.
		expect(result).toEqual({
			total: 2.25,
			cap: 28,
			breakdown: { daily: 1.75, workshop: 0.5 },
		});
	});

	it('weighs a daily absence 1 on a scheduled workshop day that was not held', async () => {
		const { service } = build({
			daily: [dailyRecord(MON, ATTENDANCE_STATUS.ABSENT)],
		});

		const result = await service.getStudentWeightedAbsences(
			'student-1',
			'year-1',
		);

		expect(result.total).toBe(1);
	});

	it('halves a daily absence on a day with a workshop record', async () => {
		const { service } = build({
			daily: [dailyRecord(MON, ATTENDANCE_STATUS.ABSENT)],
			workshop: [workshopRecord(MON, ATTENDANCE_STATUS.PRESENT)],
		});

		const result = await service.getStudentWeightedAbsences(
			'student-1',
			'year-1',
		);

		expect(result.total).toBe(0.5);
	});

	describe('for alert evaluation', () => {
		const commission = { courseId: 'course-1', number: 1 };
		const noonOf = (day: Date) => new Date(day.getTime() + 12 * 3600_000);
		afterEach(() => jest.useRealTimers());

		it('weighs a daily absence on the trigger date 0.5 when a workshop is scheduled that weekday and not taken yet', async () => {
			const { service } = build({
				daily: [dailyRecord(MON, ATTENDANCE_STATUS.ABSENT)],
				commission,
				workshopDays: [DAYOFWEEK.MONDAY],
			});

			const result = await service.getStudentWeightedAbsencesForAlert(
				'student-1',
				'year-1',
				'2026-03-09',
				noonOf(MON),
			);

			expect(result.total).toBe(0.5);
		});

		it('keeps the absence of a past day at 1 when another date triggers the evaluation', async () => {
			const { service } = build({
				daily: [dailyRecord(MON, ATTENDANCE_STATUS.ABSENT)],
				commission,
				workshopDays: [DAYOFWEEK.MONDAY, DAYOFWEEK.TUESDAY],
			});

			const result = await service.getStudentWeightedAbsencesForAlert(
				'student-1',
				'year-1',
				'2026-03-10',
				noonOf(TUE),
			);

			expect(result.total).toBe(1);
		});

		it('weighs the trigger date 1 for a student without a commission', async () => {
			const { service, commissionPort } = build({
				daily: [dailyRecord(MON, ATTENDANCE_STATUS.ABSENT)],
				commission: null,
				workshopDays: [DAYOFWEEK.MONDAY],
			});

			const result = await service.getStudentWeightedAbsencesForAlert(
				'student-1',
				'year-1',
				'2026-03-09',
				noonOf(MON),
			);

			expect(result.total).toBe(1);
			expect(commissionPort.getWorkshopDays).not.toHaveBeenCalled();
		});

		it('weighs the trigger date 1 when the commission has no workshop that weekday', async () => {
			const { service } = build({
				daily: [dailyRecord(MON, ATTENDANCE_STATUS.ABSENT)],
				commission,
				workshopDays: [DAYOFWEEK.TUESDAY],
			});

			const result = await service.getStudentWeightedAbsencesForAlert(
				'student-1',
				'year-1',
				'2026-03-09',
				noonOf(MON),
			);

			expect(result.total).toBe(1);
		});

		it('ignores the clock: an evening save after 21:00 (UTC-3) still judges the record date', async () => {
			// 22:30 in Argentina on Monday 2026-03-09 is already Tuesday in UTC.
			jest.useFakeTimers({ now: new Date('2026-03-10T01:30:00.000Z') });
			const { service } = build({
				daily: [dailyRecord(MON, ATTENDANCE_STATUS.ABSENT)],
				commission,
				workshopDays: [DAYOFWEEK.MONDAY],
			});

			const result = await service.getStudentWeightedAbsencesForAlert(
				'student-1',
				'year-1',
				'2026-03-09',
			);

			expect(result.total).toBe(0.5);
			jest.useRealTimers();
		});

		it('keeps 0.5 when the workshop record of the trigger date exists', async () => {
			const { service } = build({
				daily: [dailyRecord(MON, ATTENDANCE_STATUS.ABSENT)],
				workshop: [workshopRecord(MON, ATTENDANCE_STATUS.PRESENT)],
				commission,
				workshopDays: [DAYOFWEEK.MONDAY],
			});

			const result = await service.getStudentWeightedAbsencesForAlert(
				'student-1',
				'year-1',
				'2026-03-09',
				noonOf(MON),
			);

			expect(result.total).toBe(0.5);
		});

		it('also weighs 0.5 when the trigger date is yesterday (evening-shift UTC rollover)', async () => {
			const { service } = build({
				daily: [dailyRecord(MON, ATTENDANCE_STATUS.ABSENT)],
				commission,
				workshopDays: [DAYOFWEEK.MONDAY],
			});

			const result = await service.getStudentWeightedAbsencesForAlert(
				'student-1',
				'year-1',
				'2026-03-09',
				noonOf(TUE),
			);

			expect(result.total).toBe(0.5);
		});

		it('keeps a trigger date 3 days old held-based, without asking for the commission', async () => {
			const { service, commissionPort } = build({
				daily: [dailyRecord(MON, ATTENDANCE_STATUS.ABSENT)],
				commission,
				workshopDays: [DAYOFWEEK.MONDAY],
			});

			const result = await service.getStudentWeightedAbsencesForAlert(
				'student-1',
				'year-1',
				'2026-03-09',
				noonOf(utc('2026-03-12')),
			);

			expect(result.total).toBe(1);
			expect(commissionPort.findByStudent).not.toHaveBeenCalled();
		});

		it('leaves the report total purely held-based', async () => {
			const { service } = build({
				daily: [dailyRecord(MON, ATTENDANCE_STATUS.ABSENT)],
				commission,
				workshopDays: [DAYOFWEEK.MONDAY],
			});

			const result = await service.getStudentWeightedAbsences(
				'student-1',
				'year-1',
			);

			expect(result.total).toBe(1);
		});
	});

	it('defaults the period to the academic year and honors an explicit one', async () => {
		const { service, attendanceRepo, workshopRepo } = build({});

		await service.getStudentWeightedAbsences('student-1', 'year-1');
		expect(attendanceRepo.findDailyByStudentAndDateRange).toHaveBeenCalledWith(
			'student-1',
			year.startDate,
			year.endDate,
		);

		await service.getStudentWeightedAbsences('student-1', 'year-1', {
			from: MON,
			to: FRI,
		});
		expect(workshopRepo.findByStudentAndDateRange).toHaveBeenLastCalledWith(
			'student-1',
			MON,
			FRI,
		);
	});

	it('rejects an unknown academic year', async () => {
		const { service, academicYearPort } = build({});
		academicYearPort.findById.mockResolvedValue(null);

		const attempt = service.getStudentWeightedAbsences('student-1', 'nope');
		await expect(attempt).rejects.toBeInstanceOf(NotFoundError);
		await expect(attempt).rejects.toThrow('Ciclo lectivo no encontrado');
	});

	it('uses the institutional cap of 28', async () => {
		const { service } = build({});
		expect(await service.getStudentAbsenceCap('student-1')).toBe(28);
	});
});
