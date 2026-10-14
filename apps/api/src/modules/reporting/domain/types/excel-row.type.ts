import { ReportStudentStatus } from './student-report-entry.type';

export type ExcelRow = {
	surname: string;
	name: string;
	documentNumber: string;
	present: number;
	/** Weighted absence total (may be fractional). */
	absent: number;
	/** Daily (theory) part of the weighted absences; null for old stored reports. */
	absentDaily: number | null;
	/** Workshop part of the weighted absences; null for old stored reports. */
	absentWorkshop: number | null;
	late: number;
	justified: number;
	absencePercent: number | null;
	status: ReportStudentStatus;
};
