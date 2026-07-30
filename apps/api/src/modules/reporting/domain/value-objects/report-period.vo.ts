export class ReportPeriod {
	private readonly _month: number;
	private readonly _year: number;

	private constructor(month: number, year: number) {
		if (month > 12 || month < 1)
			throw new Error('Month must be an integer between 1 and 12');
		this._month = month;
		if (year < new Date().getFullYear())
			throw new Error('Can not register an older report');
		if (year > new Date().getFullYear())
			throw new Error('Can not register an future report');
		this._year = year;
	}
	static generate(month: number, year: number): ReportPeriod {
		return new ReportPeriod(month, year);
	}
	get month(): number {
		return this._month;
	}
	toDateRange(): { from: Date; to: Date } {
		return {
			from: new Date(this.year, this._month - 1, 1),
			to: new Date(this.year, this._month, 0),
		};
	}

	get year(): number {
		return this._year;
	}
}
