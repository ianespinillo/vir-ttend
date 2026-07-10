import { COURSE_RISK_STATUS } from '@repo/common';

export class CourseSnapshot {
	private readonly _courseId: string;
	private readonly _courseName: string;
	private readonly _totalStudents: number;
	private readonly _presents: number;
	private readonly _absents: number;
	private readonly _late: number;
	private readonly _justified: number;
	private readonly _notRecorded: number;

	constructor(
		courseId: string,
		courseName: string,
		totalStudents: number,
		presents: number,
		absents: number,
		late: number,
		justified: number,
	) {
		this._courseId = courseId;
		this._courseName = courseName;
		this._totalStudents = totalStudents;
		this._presents = presents;
		this._absents = absents;
		this._late = late;
		this._justified = justified;
		this._notRecorded = totalStudents - (presents + late + absents + justified);
	}

	public get absencePercent(): number {
		if (this._totalStudents === 0) return 0;
		return ((this._absents + this._late) / this._totalStudents) * 100;
	}
	public get presentsPercent(): number {
		if (this._presents === 0) return 0;
		return ((this._presents + this._late) / this._totalStudents) * 100;
	}
	public getRiskStatus(
		warningThreshold: number,
		criticalThreshold: number,
	): COURSE_RISK_STATUS {
		const percent = this.absencePercent;
		if (percent >= criticalThreshold) return COURSE_RISK_STATUS.CRITICAL;
		if (percent >= warningThreshold) return COURSE_RISK_STATUS.WARNING;
		return COURSE_RISK_STATUS.OK;
	}
	public toJSON() {
		return {
			courseId: this._courseId,
			courseName: this._courseName,
			totalStudents: this._totalStudents,
			present: this._presents,
			absent: this._absents,
			late: this._late,
			justified: this._justified,
			notRecorded: this._notRecorded,
			absencePercent: this.absencePercent,
		};
	}

	get courseId(): string {
		return this._courseId;
	}

	get courseName(): string {
		return this._courseName;
	}

	get totalStudents(): number {
		return this._totalStudents;
	}

	get presents(): number {
		return this._presents;
	}

	get absents(): number {
		return this._absents;
	}

	get late(): number {
		return this._late;
	}

	get notRecorded(): number {
		return this._notRecorded;
	}
}
