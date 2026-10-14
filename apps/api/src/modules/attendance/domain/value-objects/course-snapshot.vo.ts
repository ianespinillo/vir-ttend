import { COURSE_RISK_STATUS } from '@repo/common';

/**
 * Institutional absence total of the course (weighted and held-based, so it may
 * be fractional) and the student-days it is measured over: the days effectively
 * given to each student, never the schedule.
 */
export interface WeightedCourseTotals {
	absences: number;
	studentDays: number;
}

export class CourseSnapshot {
	private readonly _courseId: string;
	private readonly _courseName: string;
	private readonly _totalStudents: number;
	private readonly _presents: number;
	private readonly _absents: number;
	private readonly _late: number;
	private readonly _justified: number;
	private readonly _notRecorded: number;
	private readonly _weighted?: WeightedCourseTotals;

	constructor(
		courseId: string,
		expectedClasses: number,
		courseName: string,
		totalStudents: number,
		presents: number,
		absents: number,
		late: number,
		justified: number,
		weighted?: WeightedCourseTotals,
	) {
		this._courseId = courseId;
		this._courseName = courseName;
		this._totalStudents = totalStudents;
		this._presents = presents;
		this._absents = absents;
		this._late = late;
		this._justified = justified;
		this._weighted = weighted;
		this._notRecorded =
			expectedClasses * totalStudents - (presents + late + absents + justified);
	}

	/**
	 * Registros efectivamente cargados (con asistencia tomada).
	 * Las clases programadas sin asistencia tomada NO cuentan en los
	 * porcentajes: de lo contrario diluyen el resultado hacia abajo.
	 */
	private get recordedSlots(): number {
		return this._presents + this._absents + this._late + this._justified;
	}
	/**
	 * Absence total shown for the course: the weighted one when available,
	 * otherwise the raw count of absent records.
	 */
	public get absentTotal(): number {
		return this._weighted ? this._weighted.absences : this._absents;
	}
	public get absencePercent(): number {
		if (this._weighted) {
			const { absences, studentDays } = this._weighted;
			return studentDays === 0 ? 0 : (absences / studentDays) * 100;
		}
		const slots = this.recordedSlots;
		if (slots === 0) return 0;
		return ((this._absents + this._late) / slots) * 100;
	}
	public get presentsPercent(): number {
		if (this._weighted) {
			const { absences, studentDays } = this._weighted;
			return studentDays === 0
				? 0
				: ((studentDays - absences) / studentDays) * 100;
		}
		const slots = this.recordedSlots;
		if (slots === 0) return 0;
		return ((this._presents + this._late) / slots) * 100;
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
			absent: this.absentTotal,
			late: this._late,
			justified: this._justified,
			notRecorded: this._notRecorded,
			absencePercent: this.absencePercent,
			attendancePercent: this.presentsPercent,
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
