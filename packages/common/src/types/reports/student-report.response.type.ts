import type { LevelType } from '../../constants/level.enum.js';
import type { AlertType } from '../alerts/alert.response.type.js';
import type { StudentReportStatus } from './monthly-report.response.type.js';

export interface StudentMonthlyEntry {
	month: number;
	year: number;
	present: number;
	absent: number;
	late: number;
	justified: number;
	absencePercent: number;
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
		absent: number;
		late: number;
		justified: number;
		totalDays: number;
		averageAbsencePercent: number;
	};
	status: StudentReportStatus;
	alerts: { status: AlertType }[];
}
