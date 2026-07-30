import { StudentReportEntry } from '../../domain/types/student-report-entry.type';

export class StudentReportEntryDto {
	readonly studentId: string;
	readonly fullName: string;
	readonly documentNumber: string;
	readonly present: number;
	readonly absent: number;
	readonly late: number;
	readonly justified: number;
	readonly absencePercent: number;
	readonly status: StudentReportEntry['status'];
	readonly alerts: StudentReportEntry['alerts'];

	constructor(entry: StudentReportEntry) {
		this.studentId = entry.studentId;
		this.fullName = entry.fullName;
		this.documentNumber = entry.documentNumber;
		this.present = entry.present;
		this.absent = entry.absent;
		this.late = entry.late;
		this.justified = entry.justified;
		this.absencePercent = entry.absencePercent;
		this.status = entry.status;
		this.alerts = entry.alerts;
	}
}
