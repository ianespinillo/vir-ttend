import type { LevelType } from '../../constants/level.enum.js';
import type { AlertType } from '../alerts/alert.response.type.js';

export type StudentReportStatus = 'ok' | 'at-risk' | 'exceeded';

/** Where a weighted absence total comes from: the daily shift or the workshop. */
export interface AbsenceBreakdown {
	daily: number;
	workshop: number;
}

export interface MonthlyReportStudent {
	studentId: string;
	fullName: string;
	documentNumber: string;
	present: number;
	/**
	 * Weighted absence total (may be fractional). Reports generated before the
	 * weighting hold the plain count of absent records here.
	 */
	absent: number;
	late: number;
	justified: number;
	/** Distinct days with a daily or workshop record. Missing in older reports. */
	daysGiven?: number;
	/** Missing in reports generated before the weighting. */
	absenceBreakdown?: AbsenceBreakdown;
	/** Statistic over the days given; null when no class was given. */
	absencePercent: number | null;
	status: StudentReportStatus;
	alerts: { status: AlertType }[];
}

export interface MonthlyReport {
	id: string;
	courseId: string;
	courseName: string;
	level: LevelType;
	period: { month: number; year: number };
	workingDays: number;
	students: MonthlyReportStudent[];
	summary: {
		/** Null when no class was given. */
		averageAttendance: number | null;
		studentsAtRisk: number;
		studentsExceeded: number;
	};
	generatedAt: Date;
}
