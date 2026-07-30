import { AlertType } from './alert.type';

export type ReportStudentStatus = 'ok' | 'at-risk' | 'exceeded';

export interface StudentReportEntry {
	studentId: string;
	fullName: string;
	documentNumber: string;
	present: number;
	absent: number;
	late: number;
	justified: number;
	absencePercent: number;
	status: ReportStudentStatus;
	alerts: AlertType[];
}
