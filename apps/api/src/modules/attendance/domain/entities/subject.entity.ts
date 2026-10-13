export class Subject {
	private readonly _id: string;
	private readonly _courseId: string;
	private readonly _name: string;
	private readonly _teacherId: string;
	private constructor(
		id: string,
		courseId: string,
		subjectName: string,
		teacherId: string,
	) {
		this._id = id;
		this._courseId = courseId;
		this._name = subjectName;
		this._teacherId = teacherId;
	}
	static reconstitute(
		id: string,
		courseId: string,
		subjectName: string,
		teacherId: string,
	) {
		return new Subject(id, courseId, subjectName, teacherId);
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
}
