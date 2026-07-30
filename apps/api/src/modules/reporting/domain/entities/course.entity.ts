import { LevelType } from '@repo/common';

interface ConstructorParameters {
	id: string;
	academicYearId: string;
	tenantId: string;
	name: string;
	level: LevelType;
}

export class Course {
	private readonly _id: string;
	private readonly _academicYearId: string;
	private readonly _name: string;
	private readonly _level: LevelType;
	private readonly _tenantId: string;
	private constructor({
		id,
		academicYearId,
		name,
		level,
		tenantId,
	}: ConstructorParameters) {
		this._id = id;
		this._academicYearId = academicYearId;
		this._name = name;
		this._level = level;
		this._tenantId = tenantId;
	}
	static reconstitute(props: ConstructorParameters) {
		return new Course(props);
	}

	get tenantId(): string {
		return this._tenantId;
	}

	get level(): LevelType {
		return this._level;
	}

	get id(): string {
		return this._id;
	}

	get academicYearId(): string {
		return this._academicYearId;
	}

	get name(): string {
		return this._name;
	}
}
