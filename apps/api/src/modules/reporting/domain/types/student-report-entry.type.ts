import { AbsenceBreakdown } from './absence-breakdown.type';
import { AlertType } from './alert.type';

export type ReportStudentStatus = 'ok' | 'at-risk' | 'exceeded';

export interface StudentReportEntry {
	studentId: string;
	fullName: string;
	documentNumber: string;
	present: number;
	/** Weighted, held-based absence total (may be fractional). */
	absent: number;
	late: number;
	justified: number;
	/** Distinct days with a daily or workshop record. Missing in older stored reports. */
	daysGiven?: number;
	/** Missing in older stored reports. */
	absenceBreakdown?: AbsenceBreakdown;
	/** Statistic over the days given; null when no class was given. */
	absencePercent: number | null;
	status: ReportStudentStatus;
	alerts: AlertType[];
}
