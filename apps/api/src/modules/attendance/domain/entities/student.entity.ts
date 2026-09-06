export class Student {
	private readonly _id: string;
	private readonly _name: string;

	private constructor(id: string, name: string) {
		this._id = id;
		this._name = name;
	}
	static reconstitute(id: string, name: string) {
		return new Student(id, name);
	}

	get name(): string {
		return this._name;
	}

	get id(): string {
		return this._id;
	}
}
