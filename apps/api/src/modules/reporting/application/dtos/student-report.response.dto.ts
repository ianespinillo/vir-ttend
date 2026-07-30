import { LevelType } from '@repo/common';
import { StudentMonthlyEntry } from '../../domain/types/detailed-student-report.type';
import { StudentReportEntry } from '../../domain/types/student-report-entry.type';

export class StudentReportResponseDto {
	readonly studentId: string;
	readonly fullName: string;
	readonly documentNumber: string;
	readonly courseId: string;
	readonly courseName: string;
	readonly level: LevelType;
	readonly academicYearId: string;
	readonly months: StudentMonthlyEntry[];
	readonly totals: {
		present: number;
		absent: number;
		late: number;
		justified: number;
		totalDays: number;
		averageAbsencePercent: number;
	};
	readonly status: StudentReportEntry['status'];
	readonly alerts: StudentReportEntry['alerts'];

	constructor(props: {
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
	}) {
		this.studentId = props.studentId;
		this.fullName = props.fullName;
		this.documentNumber = props.documentNumber;
		this.courseId = props.courseId;
		this.courseName = props.courseName;
		this.level = props.level;
		this.academicYearId = props.academicYearId;
		this.months = props.months;
		this.totals = props.totals;
		this.status = props.status;
		this.alerts = props.alerts;
	}
}
