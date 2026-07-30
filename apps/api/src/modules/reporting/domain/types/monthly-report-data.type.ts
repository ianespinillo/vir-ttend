import { LevelType } from '@repo/common';
import { StudentReportEntry } from './student-report-entry.type';

export interface IMonthlyReportData {
	courseName: string;
	level: LevelType;
	period: { month: number; year: number };
	workingDays: number;
	students: StudentReportEntry[];
	summary: {
		averageAttendance: number;
		studentsAtRisk: number;
		studentsExceeded: number;
	};
}
