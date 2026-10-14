import { LevelType } from '@repo/common';
import { AbsenceBreakdown } from './absence-breakdown.type';
import {
	ReportStudentStatus,
	StudentReportEntry,
} from './student-report-entry.type';

export interface StudentMonthlyEntry {
	month: number;
	year: number;
	present: number;
	/** Weighted absence total (may be fractional). */
	absent: number;
	late: number;
	justified: number;
	daysGiven: number;
	absenceBreakdown: AbsenceBreakdown;
	/** Null when no class was given. */
	absencePercent: number | null;
	status: StudentReportEntry['status'];
}

export interface IDetailedStudentReport {
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
		absenceBreakdown: AbsenceBreakdown;
		/** Null when no class was given. */
		averageAbsencePercent: number | null;
	};
	status: StudentReportEntry['status'];
	alerts: StudentReportEntry['alerts'];
}
