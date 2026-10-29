import { ATTENDANCE_STATUS, DAYOFWEEK, SHIFT } from '@repo/common';
import { NotFoundError } from '../../../src/common/errors';
import { AcademicYear as InstitutionalYear } from '../../../src/modules/academic/domain/entities/academic-year.entity';
import { StudentWeightedAbsencesService } from '../../../src/modules/attendance/application/services/student-weighted-absences.service';
import { TheoryNotHeldDaysService } from '../../../src/modules/attendance/application/services/theory-not-held-days.service';
import { AcademicYear } from '../../../src/modules/attendance/domain/entities/academic-year.entity';
import { AttendanceRecord } from '../../../src/modules/attendance/domain/entities/attendance-record.entity';
import { WorkshopAttendanceRecord } from '../../../src/modules/attendance/domain/entities/workshop-attendance-record.entity';
import { AcademicYearAdapter } from '../../../src/modules/attendance/infrastructure/adapters/academic-year.adapter';

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
		commission?: { id?: string; courseId: string; number: number } | null;
		workshopDays?: DAYOFWEEK[];
		/** Days the preceptor marked the theory of the course as not held. */
		theoryMarkers?: string[];
		/** Institutional suspension of a day, optionally scoped to shifts. */
		suspension?: { day: string; shifts?: SHIFT[] };
		courseShift?: SHIFT;
		/** Days the workshop of the commission was marked as not held. */
		workshopMarkers?: string[];
	}) {
		const attendanceRepo = {
			findDailyByStudentAndDateRange: jest
				.fn()
				.mockResolvedValue(opts.daily ?? []),
		};
		const workshopRepo = {
			findByStudentAndDateRange: jest.fn().mockResolvedValue(opts.workshop ?? []),
		};
		const suspension = opts.suspension;
		const academicYearPort = suspension
			? new AcademicYearAdapter(
					{
						findById: jest.fn().mockResolvedValue(
							InstitutionalYear.reconstitute({
								id: 'year-1',
								tenantId: 't',
								year: 2026,
								startDate: utc('2026-03-02'),
								endDate: utc('2026-12-18'),
								nonWorkingDays: [utc(suspension.day)],
								nonWorkingDayShifts: suspension.shifts
									? { [suspension.day]: suspension.shifts }
									: {},
								absenceThresholdPercent: 25,
								lateCountAbscenseAfterMinutes: 20,
								isActive: true,
								createdAt: new Date(),
								updatedAt: new Date(),
							}),
						),
					} as never,
					{} as never,
				)
			: {
					findById: jest.fn().mockResolvedValue(year),
					getNonWorkingDays: jest.fn().mockResolvedValue([]),
				};
		const coursePort = {
			findById: jest.fn().mockResolvedValue({
				id: 'course-1',
				academicYearId: 'year-1',
				shift: opts.courseShift,
				isWorkshopOnly: false,
			}),
		};
		const dailyNotHeldRepo = {
			findByCourseAndDateRange: jest
				.fn()
				.mockResolvedValue(
					(opts.theoryMarkers ?? []).map((day) => ({ date: utc(day) })),
				),
		};
		const workshopNotHeldRepo = {
			findByCommissionAndDate: jest
				.fn()
				.mockImplementation(async (_commissionId: string, date: Date) =>
					(opts.workshopMarkers ?? []).includes(date.toISOString().slice(0, 10))
						? { date }
						: null,
				),
		};
		const commissionPort = {
			findByStudent: jest.fn().mockResolvedValue(opts.commission ?? null),
			getWorkshopDays: jest.fn().mockResolvedValue(opts.workshopDays ?? []),
		};
		const service = new StudentWeightedAbsencesService(
			attendanceRepo as never,
			workshopRepo as never,
			academicYearPort as never,
			commissionPort as never,
			coursePort as never,
			workshopNotHeldRepo as never,
			new TheoryNotHeldDaysService(
				dailyNotHeldRepo as never,
				academicYearPort as never,
			),
		);
		return {
			service,
			attendanceRepo,
			workshopRepo,
			academicYearPort,
			commissionPort,
			workshopNotHeldRepo,
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

	describe('when the theory was not held', () => {
		const absentWorkshop = [workshopRecord(MON, ATTENDANCE_STATUS.ABSENT)];
		const weigh = (service: StudentWeightedAbsencesService, courseId?: string) =>
			service.getStudentWeightedAbsences('student-1', 'year-1', undefined, {
				courseId,
			});

		it('weighs a workshop absence 1 on a day the preceptor marked the theory not held', async () => {
			const { service } = build({
				workshop: absentWorkshop,
				theoryMarkers: ['2026-03-09'],
			});

			const result = await weigh(service, 'course-1');

			expect(result.total).toBe(1);
			expect(result.breakdown).toEqual({ daily: 0, workshop: 1 });
		});

		it('keeps 0.5 on the days the theory was held', async () => {
			const { service } = build({
				workshop: absentWorkshop,
				theoryMarkers: ['2026-03-10'],
			});

			expect((await weigh(service, 'course-1')).total).toBe(0.5);
		});

		it('weighs it 1 on an institutional suspension of the whole school', async () => {
			const { service } = build({
				workshop: absentWorkshop,
				suspension: { day: '2026-03-09' },
				courseShift: SHIFT.AFTERNOON,
			});

			expect((await weigh(service, 'course-1')).total).toBe(1);
		});

		it('weighs it 1 on a suspension scoped to the shift of the course', async () => {
			const { service } = build({
				workshop: absentWorkshop,
				suspension: { day: '2026-03-09', shifts: [SHIFT.MORNING] },
				courseShift: SHIFT.MORNING,
			});

			expect((await weigh(service, 'course-1')).total).toBe(1);
		});

		it('keeps 0.5 when the suspension is scoped to another shift', async () => {
			const { service } = build({
				workshop: absentWorkshop,
				suspension: { day: '2026-03-09', shifts: [SHIFT.MORNING] },
				courseShift: SHIFT.AFTERNOON,
			});

			expect((await weigh(service, 'course-1')).total).toBe(0.5);
		});

		it('does not look for them without a course', async () => {
			const { service } = build({
				workshop: absentWorkshop,
				theoryMarkers: ['2026-03-09'],
			});

			expect((await weigh(service)).total).toBe(0.5);
		});

		it('applies to the alert total too', async () => {
			const { service } = build({
				workshop: absentWorkshop,
				theoryMarkers: ['2026-03-09'],
			});

			const result = await service.getStudentWeightedAbsencesForAlert(
				'student-1',
				'year-1',
				undefined,
				{ courseId: 'course-1' },
			);

			expect(result.total).toBe(1);
		});
	});

	describe('for alert evaluation', () => {
		const commission = { id: 'commission-1', courseId: 'course-1', number: 1 };
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
				{ now: noonOf(MON) },
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
				{ now: noonOf(TUE) },
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
				{ now: noonOf(MON) },
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
				{ now: noonOf(MON) },
			);

			expect(result.total).toBe(1);
		});

		it('weighs the trigger date 1 when the workshop of that day was marked as not held', async () => {
			const { service, workshopNotHeldRepo } = build({
				daily: [dailyRecord(MON, ATTENDANCE_STATUS.ABSENT)],
				commission,
				workshopDays: [DAYOFWEEK.MONDAY],
				workshopMarkers: ['2026-03-09'],
			});

			const result = await service.getStudentWeightedAbsencesForAlert(
				'student-1',
				'year-1',
				'2026-03-09',
				{ now: noonOf(MON) },
			);

			expect(result.total).toBe(1);
			expect(workshopNotHeldRepo.findByCommissionAndDate).toHaveBeenCalledWith(
				'commission-1',
				MON,
			);
		});

		it('keeps 0.5 when only another day of the workshop was marked as not held', async () => {
			const { service } = build({
				daily: [dailyRecord(MON, ATTENDANCE_STATUS.ABSENT)],
				commission,
				workshopDays: [DAYOFWEEK.MONDAY],
				workshopMarkers: ['2026-03-02'],
			});

			const result = await service.getStudentWeightedAbsencesForAlert(
				'student-1',
				'year-1',
				'2026-03-09',
				{ now: noonOf(MON) },
			);

			expect(result.total).toBe(0.5);
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
				{ now: noonOf(MON) },
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
				{ now: noonOf(TUE) },
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
				{ now: noonOf(utc('2026-03-12')) },
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

	describe('workshop-only course (7th year technical)', () => {
		it('weighs a workshop absence 1 in the report total', async () => {
			const { service } = build({
				workshop: [workshopRecord(MON, ATTENDANCE_STATUS.ABSENT)],
			});

			const result = await service.getStudentWeightedAbsences(
				'student-1',
				'year-1',
				undefined,
				{ workshopOnly: true },
			);

			expect(result.total).toBe(1);
			expect(result.breakdown).toEqual({ daily: 0, workshop: 1 });
		});

		it('weighs a workshop absence 1 in the alert total and skips the expected contraturno', async () => {
			const { service, commissionPort } = build({
				workshop: [workshopRecord(MON, ATTENDANCE_STATUS.ABSENT)],
				commission: { courseId: 'course-1', number: 1 },
				workshopDays: [DAYOFWEEK.MONDAY],
			});

			const result = await service.getStudentWeightedAbsencesForAlert(
				'student-1',
				'year-1',
				'2026-03-09',
				{ now: new Date(MON.getTime() + 12 * 3600_000), workshopOnly: true },
			);

			expect(result.total).toBe(1);
			expect(commissionPort.findByStudent).not.toHaveBeenCalled();
		});

		it('keeps the halved weight for a regular course', async () => {
			const { service } = build({
				workshop: [workshopRecord(MON, ATTENDANCE_STATUS.ABSENT)],
			});

			const result = await service.getStudentWeightedAbsences(
				'student-1',
				'year-1',
			);

			expect(result.total).toBe(0.5);
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
		(academicYearPort.findById as jest.Mock).mockResolvedValue(null);

		const attempt = service.getStudentWeightedAbsences('student-1', 'nope');
		await expect(attempt).rejects.toBeInstanceOf(NotFoundError);
		await expect(attempt).rejects.toThrow('Ciclo lectivo no encontrado');
	});

	it('uses the institutional cap of 28', async () => {
		const { service } = build({});
		expect(await service.getStudentAbsenceCap('student-1')).toBe(28);
	});
});
