import { LevelType, isWorkshopOnlyCourse } from '@repo/common';

export class Course {
	private readonly _id: string;
	private readonly _name: string;
	private readonly _academicYearId: string;
	private readonly _level: LevelType;
	private readonly _isActive: boolean;
	private readonly _yearNumber: number | null;

	private constructor(
		id: string,
		name: string,
		academicYearId: string,
		isActive: boolean,
		level: LevelType,
		yearNumber: number | null,
	) {
		this._id = id;
		this._name = name;
		this._academicYearId = academicYearId;
		this._isActive = isActive;
		this._level = level;
		this._yearNumber = yearNumber;
	}
	static reconstitute(
		id: string,
		name: string,
		academicYearId: string,
		isActive: boolean,
		level: LevelType,
		yearNumber: number | null = null,
	) {
		return new Course(id, name, academicYearId, isActive, level, yearNumber);
	}

	get id(): string {
		return this._id;
	}

	get name(): string {
		return this._name;
	}

	get academicYearId(): string {
		return this._academicYearId;
	}

	get isActive(): boolean {
		return this._isActive;
	}
	get level(): LevelType {
		return this._level;
	}

	get yearNumber(): number | null {
		return this._yearNumber;
	}
	/** 7th year technical: no daily attendance, workshop is the only shift. */
	get isWorkshopOnly(): boolean {
		return isWorkshopOnlyCourse({
			level: this._level,
			yearNumber: this._yearNumber,
		});
	}
}
