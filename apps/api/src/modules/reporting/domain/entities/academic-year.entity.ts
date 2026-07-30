interface ConstructorProps {
	id: string;
	tenantId: string;
	year: number;
	startDate: Date;
	endDate: Date;
}
export class AcademicYear {
	private readonly _id: string;
	private _tenantId: string;
	private _year: number;
	private _startDate: Date;
	private _endDate: Date;
	private constructor(props: ConstructorProps) {
		this._id = props.id;
		this._tenantId = props.tenantId;
		this._year = props.year;
		this._startDate = props.startDate;
		this._endDate = props.endDate;
	}
	static reconstitute(props: ConstructorProps) {
		return new AcademicYear(props);
	}

	get id(): string {
		return this._id;
	}

	get tenantId(): string {
		return this._tenantId;
	}

	get year(): number {
		return this._year;
	}

	get startDate(): Date {
		return this._startDate;
	}

	get endDate(): Date {
		return this._endDate;
	}
}
