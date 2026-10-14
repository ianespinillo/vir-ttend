import type { AttendanceStatus } from '@repo/common';
import { ATTENDANCE_STATUS } from '@repo/common';
import { AttendanceRecord } from '../../../src/modules/reporting/domain/entities/attendance-record.entity';
import { MetricsCalculationService } from '../../../src/modules/reporting/domain/services/metrics-calculation.service';

// 2026-03-09 is a Monday; each record gets its own day unless one is given.
const day = (n: number) =>
	new Date(`2026-03-${String(n).padStart(2, '0')}T00:00:00.000Z`);

const makeRecord = (
	status: AttendanceStatus,
	date = day(9),
): AttendanceRecord =>
	AttendanceRecord.reconstitute({
		id: `rec-${Math.random().toString(36).slice(2)}`,
		studentId: 'student-1',
		courseId: 'course-1',
		date,
		status,
	});

describe('MetricsCalculationService', () => {
	let service: MetricsCalculationService;

	beforeEach(() => {
		service = new MetricsCalculationService();
	});

	describe('calculateStudentMetrics', () => {
		it('returns zeros and no percentage when no class was given', () => {
			const result = service.calculateStudentMetrics([]);
			expect(result.present).toBe(0);
			expect(result.absent).toBe(0);
			expect(result.late).toBe(0);
			expect(result.justified).toBe(0);
			expect(result.daysGiven).toBe(0);
			expect(result.absencePercent).toBeNull();
			expect(result.status).toBe('ok');
		});

		it('counts every late status in the late count', () => {
			const result = service.calculateStudentMetrics([
				makeRecord(ATTENDANCE_STATUS.LATE, day(9)),
				makeRecord(ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE, day(10)),
			]);
			expect(result.late).toBe(2);
		});

		it('keeps the status counts as record counts and weighs the absence total', () => {
			const result = service.calculateStudentMetrics([
				makeRecord(ATTENDANCE_STATUS.PRESENT, day(9)),
				makeRecord(ATTENDANCE_STATUS.PRESENT, day(10)),
				makeRecord(ATTENDANCE_STATUS.ABSENT, day(11)),
				makeRecord(ATTENDANCE_STATUS.LATE, day(12)),
				makeRecord(ATTENDANCE_STATUS.JUSTIFIED, day(13)),
			]);
			expect(result.present).toBe(2);
			expect(result.late).toBe(1);
			expect(result.justified).toBe(1);
			// absent 1 + late 0.25 + justified 1 (still counts).
			expect(result.absent).toBe(2.25);
			expect(result.absenceBreakdown).toEqual({ daily: 2.25, workshop: 0 });
			expect(result.daysGiven).toBe(5);
		});

		it('halves the daily absence on a day with a workshop record and adds the workshop part', () => {
			const result = service.calculateStudentMetrics(
				[makeRecord(ATTENDANCE_STATUS.ABSENT, day(9))],
				[makeRecord(ATTENDANCE_STATUS.ABSENT, day(9))],
			);
			// 0.5 + 0.5 = 1, a full day.
			expect(result.absent).toBe(1);
			expect(result.absenceBreakdown).toEqual({ daily: 0.5, workshop: 0.5 });
			expect(result.daysGiven).toBe(1);
		});

		it('weighs a late 0.25, and a late beyond the tolerance 0.5', () => {
			expect(
				service.calculateStudentMetrics([makeRecord(ATTENDANCE_STATUS.LATE)])
					.absent,
			).toBe(0.25);
			expect(
				service.calculateStudentMetrics([
					makeRecord(ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE),
				]).absent,
			).toBe(0.5);
		});

		it('never weighs a day more than 1', () => {
			const result = service.calculateStudentMetrics(
				[makeRecord(ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE)],
				[makeRecord(ATTENDANCE_STATUS.ABSENT)],
			);
			expect(result.absent).toBe(1);
		});

		it('counts a day once in the days given when it has a daily and a workshop record', () => {
			const result = service.calculateStudentMetrics(
				[
					makeRecord(ATTENDANCE_STATUS.PRESENT, day(9)),
					makeRecord(ATTENDANCE_STATUS.PRESENT, day(10)),
				],
				[makeRecord(ATTENDANCE_STATUS.PRESENT, day(9))],
			);
			expect(result.daysGiven).toBe(2);
		});

		it('computes the percentage as weighted absences over the days given', () => {
			const result = service.calculateStudentMetrics([
				makeRecord(ATTENDANCE_STATUS.PRESENT, day(9)),
				makeRecord(ATTENDANCE_STATUS.PRESENT, day(10)),
				makeRecord(ATTENDANCE_STATUS.PRESENT, day(11)),
				makeRecord(ATTENDANCE_STATUS.LATE, day(12)),
			]);
			// 0.25 over 4 days given; attendance is (4 - 0.25) / 4.
			expect(result.absencePercent).toBeCloseTo(6.25, 10);
		});

		describe('status thresholds', () => {
			const withPercent = (absent: number, present: number) =>
				service.calculateStudentMetrics([
					...Array.from({ length: absent }, (_, i) =>
						makeRecord(ATTENDANCE_STATUS.ABSENT, day(i + 1)),
					),
					...Array.from({ length: present }, (_, i) =>
						makeRecord(ATTENDANCE_STATUS.PRESENT, day(absent + i + 1)),
					),
				]);

			it('is ok below the warning threshold', () => {
				const result = withPercent(3, 7);
				expect(result.absencePercent).toBe(30);
				expect(result.status).toBe('ok');
			});

			it('is at-risk from the warning threshold', () => {
				const result = withPercent(3, 1);
				expect(result.absencePercent).toBe(75);
				expect(result.status).toBe('at-risk');
			});

			it('is exceeded from the critical threshold', () => {
				const result = withPercent(9, 1);
				expect(result.absencePercent).toBe(90);
				expect(result.status).toBe('exceeded');
			});
		});
	});
});
