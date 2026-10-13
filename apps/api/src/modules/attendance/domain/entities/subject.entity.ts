export class Subject {
	private readonly _id: string;
	private readonly _courseId: string;
	private readonly _name: string;
	private readonly _teacherId: string;
	private readonly _tenantId: string;
	private constructor(
		id: string,
		courseId: string,
		subjectName: string,
		teacherId: string,
		tenantId = '',
	) {
		this._id = id;
		this._courseId = courseId;
		this._name = subjectName;
		this._teacherId = teacherId;
		this._tenantId = tenantId;
	}
	static reconstitute(
		id: string,
		courseId: string,
		subjectName: string,
		teacherId: string,
		tenantId = '',
	) {
		return new Subject(id, courseId, subjectName, teacherId, tenantId);
	}

	get name(): string {
		return this._name;
	}

	get id(): string {
		return this._id;
	}

	get courseId(): string {
		return this._courseId;
	}

	get teacherId(): string {
		return this._teacherId;
	}

	get tenantId(): string {
		return this._tenantId;
	}
}
