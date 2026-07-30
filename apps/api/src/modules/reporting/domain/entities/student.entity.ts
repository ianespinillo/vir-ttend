interface ConstructParams {
	id: string;
	name: string;
	documentNumber: string;
}

export class Student {
	private readonly _id: string;
	private readonly _name: string;
	private readonly _documentNumber: string;

	private constructor(params: ConstructParams) {
		this._id = params.id;
		this._name = params.name;
		this._documentNumber = params.documentNumber;
	}
	static reconstitute(params: ConstructParams) {
		return new Student(params);
	}

	get id(): string {
		return this._id;
	}

	get name(): string {
		return this._name;
	}

	get documentNumber(): string {
		return this._documentNumber;
	}
}
