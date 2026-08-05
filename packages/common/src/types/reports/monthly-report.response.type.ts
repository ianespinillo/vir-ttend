import type { LevelType } from '../../constants/level.enum.js';
import type { AlertType } from '../alerts/alert.response.type.js';

export type StudentReportStatus = 'ok' | 'at-risk' | 'exceeded';

export interface MonthlyReportStudent {
	studentId: string;
	fullName: string;
	documentNumber: string;
	present: number;
	absent: number;
	late: number;
	justified: number;
	absencePercent: number;
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
		averageAttendance: number;
		studentsAtRisk: number;
		studentsExceeded: number;
	};
	generatedAt: Date;
}
