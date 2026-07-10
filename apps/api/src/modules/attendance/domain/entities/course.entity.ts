import { LevelType } from '@repo/common';

export class Course {
	private readonly _id: string;
	private readonly _name: string;
	private readonly _academicYearId: string;
	private readonly _level: LevelType;
	private readonly _isActive: boolean;

	private constructor(
		id: string,
		name: string,
		academicYearId: string,
		isActive: boolean,
		level: LevelType,
	) {
		this._id = id;
		this._name = name;
		this._academicYearId = academicYearId;
		this._isActive = isActive;
		this._level = level;
	}
	static reconstitute(
		id: string,
		name: string,
		academicYearId: string,
		isActive: boolean,
		level: LevelType,
	) {
		return new Course(id, name, academicYearId, isActive, level);
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
}
