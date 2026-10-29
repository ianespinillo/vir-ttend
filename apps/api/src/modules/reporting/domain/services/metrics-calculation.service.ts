import {
	ATTENDANCE_STATUS,
	ATTENDANCE_THRESHOLDS,
	isLateStatus,
} from '@repo/common';
import {
	WeightedAbsenceOptions,
	calculateWeightedAbsences,
	countDaysGiven,
} from '../../../attendance/domain/services/weighted-absence';
import { AttendanceRecord } from '../entities/attendance-record.entity';
import { IStudentMetrics } from '../types/student-metrics.type';

/**
 * Per-student report metrics. The absence total is the institutional one:
 * weighted and held-based (see `calculateWeightedAbsences`). The percentage is a
 * statistic over the days effectively given, never the schedule.
 */
export class MetricsCalculationService {
	/**
	 * @param dailyRecords daily attendance only (no subject records)
	 * @param workshopRecords workshop attendance of the same student and period
	 * @param options `workshopOnly` for a 7th-year technical course;
	 *   `theoryNotHeldDays` are the days with no theory class (a workshop absence
	 *   weighs 1 then)
	 */
	calculateStudentMetrics(
		dailyRecords: AttendanceRecord[],
		workshopRecords: AttendanceRecord[] = [],
		options: WeightedAbsenceOptions = {},
	): IStudentMetrics {
		const { total, breakdown } = calculateWeightedAbsences({
			dailyRecords,
			workshopRecords,
			workshopOnly: options.workshopOnly,
			theoryNotHeldDays: options.theoryNotHeldDays,
		});
		const daysGiven = countDaysGiven(dailyRecords, workshopRecords);
		const absencePercent = daysGiven > 0 ? (total / daysGiven) * 100 : null;
		return {
			present: dailyRecords.filter((r) => r.status === ATTENDANCE_STATUS.PRESENT)
				.length,
			absent: total,
			late: dailyRecords.filter((r) => isLateStatus(r.status)).length,
			justified: dailyRecords.filter(
				(r) => r.status === ATTENDANCE_STATUS.JUSTIFIED,
			).length,
			absenceBreakdown: breakdown,
			daysGiven,
			absencePercent,
			status: this.getStatus(absencePercent),
		};
	}

	getStatus(absencePercent: number | null): IStudentMetrics['status'] {
		if (absencePercent === null) return 'ok';
		if (absencePercent >= ATTENDANCE_THRESHOLDS.CRITICAL) return 'exceeded';
		if (absencePercent >= ATTENDANCE_THRESHOLDS.WARNING) return 'at-risk';
		return 'ok';
	}
}
