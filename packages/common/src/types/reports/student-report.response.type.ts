import type { LevelType } from '../../constants/level.enum.js';
import type { AlertType } from '../alerts/alert.response.type.js';
import type {
	AbsenceBreakdown,
	StudentReportStatus,
} from './monthly-report.response.type.js';

export interface StudentMonthlyEntry {
	month: number;
	year: number;
	present: number;
	/** Weighted absence total (may be fractional). */
	absent: number;
	late: number;
	justified: number;
	daysGiven?: number;
	absenceBreakdown?: AbsenceBreakdown;
	/** Null when no class was given. */
	absencePercent: number | null;
	status: StudentReportStatus;
}

export interface StudentReport {
	studentId: string;
	fullName: string;
	documentNumber: string;
	courseId: string;
	courseName: string;
	level: LevelType;
	academicYearId: string;
	months: StudentMonthlyEntry[];
	totals: {
		present: number;
		/** Weighted absence total (may be fractional). */
		absent: number;
		late: number;
		justified: number;
		/** Distinct days with a daily or workshop record. */
		totalDays: number;
		absenceBreakdown?: AbsenceBreakdown;
		/** Null when no class was given. */
		averageAbsencePercent: number | null;
	};
	status: StudentReportStatus;
	alerts: { status: AlertType }[];
}
