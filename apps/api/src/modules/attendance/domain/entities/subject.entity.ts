export class Subject {
	private readonly _id: string;
	private readonly _courseId: string;
	private readonly _name: string;
	private constructor(id: string, courseId: string, subjectName: string) {
		this._id = id;
		this._courseId = courseId;
		this._name = subjectName;
	}
	static reconstitute(id: string, courseId: string, subjectName: string) {
		return new Subject(id, courseId, subjectName);
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
}
