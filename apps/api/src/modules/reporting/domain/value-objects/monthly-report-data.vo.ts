import { LevelType } from '@repo/common';
import { IMonthlyReportData } from '../types/monthly-report-data.type';
import { StudentReportEntry } from '../types/student-report-entry.type';

export class MonthlyReportData {
	private readonly _courseName: string;
	private readonly _level: LevelType;
	private readonly _period: { month: number; year: number };
	private readonly _students: StudentReportEntry[];
	private readonly _summary: {
		averageAttendance: number;
		studentsAtRisk: number;
		studentsExceeded: number;
	};
	private readonly _workingDays: number;
	private constructor(data: IMonthlyReportData) {
		this._courseName = data.courseName;
		this._level = data.level;
		this._period = data.period;
		this._students = data.students;
		this._workingDays = data.workingDays;
		this._summary = data.summary;
	}
	static fromData(data: IMonthlyReportData): MonthlyReportData {
		return new MonthlyReportData(data);
	}
	modify(data: Partial<IMonthlyReportData>) {
		return new MonthlyReportData({
			...data,
			...this,
		} as IMonthlyReportData);
	}
	get toJSON() {
		return {
			courseName: this.courseName,
			level: this.level,
			period: this.period,
			students: this.students,
			workingDays: this.workingDays,
			summary: this.summary,
		};
	}
	get courseName(): string {
		return this._courseName;
	}

	get level(): LevelType {
		return this._level;
	}

	get period(): { month: number; year: number } {
		return this._period;
	}

	get students(): StudentReportEntry[] {
		return this._students;
	}

	get summary(): {
		averageAttendance: number;
		studentsAtRisk: number;
		studentsExceeded: number;
	} {
		return this._summary;
	}

	get workingDays(): number {
		return this._workingDays;
	}
}
