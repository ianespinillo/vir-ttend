import { ReportStudentStatus } from './student-report-entry.type';

export type ExcelRow = {
	surname: string;
	name: string;
	documentNumber: string;
	present: number;
	/** Weighted absence total (may be fractional). */
	absent: number;
	late: number;
	justified: number;
	absencePercent: number | null;
	status: ReportStudentStatus;
};
