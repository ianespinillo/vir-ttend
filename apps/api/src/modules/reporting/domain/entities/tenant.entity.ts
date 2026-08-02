interface ReconstituteProps {
	id: string;
	name: string;
}

export class Tenant {
	private readonly _id: string;
	private readonly _name: string;

	private constructor(props: ReconstituteProps) {
		this._id = props.id;
		this._name = props.name;
	}
	static reconstitute(props: ReconstituteProps): Tenant {
		return new Tenant(props);
	}

	get id(): string {
		return this._id;
	}

	get name(): string {
		return this._name;
	}
}
