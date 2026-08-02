import { ReportStudentStatus } from './student-report-entry.type';

export type ExcelRow = {
	surname: string;
	name: string;
	documentNumber: string;
	present: number;
	absent: number;
	late: number;
	justified: number;
	absencePercent: number;
	status: ReportStudentStatus;
};
