import { AbsenceBreakdown } from './absence-breakdown.type';

export interface IStudentMetrics {
	present: number;
	/** Weighted, held-based absence total (may be fractional). */
	absent: number;
	late: number;
	justified: number;
	absenceBreakdown: AbsenceBreakdown;
	/** Distinct days with a daily or workshop record. */
	daysGiven: number;
	/** Absences over the days given; null when no class was given. */
	absencePercent: number | null;
	status: 'ok' | 'at-risk' | 'exceeded';
}
