import { LevelType } from '@repo/common';
import {
	ReportStudentStatus,
	StudentReportEntry,
} from './student-report-entry.type';

export interface StudentMonthlyEntry {
	month: number;
	year: number;
	present: number;
	absent: number;
	late: number;
	justified: number;
	absencePercent: number;
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
		absent: number;
		late: number;
		justified: number;
		totalDays: number;
		averageAbsencePercent: number;
	};
	status: StudentReportEntry['status'];
	alerts: StudentReportEntry['alerts'];
}
