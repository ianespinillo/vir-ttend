import { LevelType } from '@repo/common';
import { MonthlyReport } from '../../domain/entities/monthly-report.entity';
import { StudentReportEntry } from '../../domain/types/student-report-entry.type';

export class MonthlyReportResponseDto {
	readonly id: string;
	readonly courseId: string;
	readonly courseName: string;
	readonly level: LevelType;
	readonly period: { month: number; year: number };
	readonly workingDays: number;
	readonly students: StudentReportEntry[];
	readonly summary: {
		averageAttendance: number;
		studentsAtRisk: number;
		studentsExceeded: number;
	};
	readonly generatedAt: Date;

	constructor(report: MonthlyReport) {
		const data = report.data.toJSON;
		this.id = report.id;
		this.courseId = report.courseId;
		this.courseName = data.courseName;
		this.level = data.level;
		this.period = data.period;
		this.workingDays = data.workingDays;
		this.students = data.students;
		this.summary = data.summary;
		this.generatedAt = report.generatedAt;
	}
}
