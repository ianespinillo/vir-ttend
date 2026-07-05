export class AcademicYear {
	private readonly _id: string;
	private readonly _absenceThresholdPercent: number;
	private readonly _lateCountAbscenseAfterMinutes: number;
	private readonly _startDate: Date;
	private readonly _endDate: Date;
	private constructor(
		id: string,
		absenceThresholdPercent: number,
		lateCountAbscenseAfterMinutes: number,
		startDate: Date,
		endDate: Date,
	) {
		this._id = id;
		this._absenceThresholdPercent = absenceThresholdPercent;
		this._lateCountAbscenseAfterMinutes = lateCountAbscenseAfterMinutes;
		this._startDate = startDate;
		this._endDate = endDate;
	}
	public static reconstitute(
		id: string,
		absenceThresholdPercent: number,
		lateCountAbscenseAfterMinutes: number,
		startDate: Date,
		endDate: Date,
	) {
		return new AcademicYear(
			id,
			absenceThresholdPercent,
			lateCountAbscenseAfterMinutes,
			startDate,
			endDate,
		);
	}

	get id(): string {
		return this._id;
	}

	get absenceThresholdPercent(): number {
		return this._absenceThresholdPercent;
	}

	get lateCountAbscenseAfterMinutes(): number {
		return this._lateCountAbscenseAfterMinutes;
	}

	get startDate(): Date {
		return this._startDate;
	}

	get endDate(): Date {
		return this._endDate;
	}
}
