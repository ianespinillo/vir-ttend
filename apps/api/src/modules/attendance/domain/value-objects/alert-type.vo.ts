type Status = 'warning' | 'critical' | 'exceeded';
export class AlertType {
	private readonly _status: Status;
	private constructor(status: Status) {
		this._status = status;
	}
	static fromPercent(percentage: number): AlertType | null {
		if (percentage >= 100) return AlertType.exceeded();
		if (percentage >= 75) return AlertType.critical();
		if (percentage >= 50) return AlertType.warning();
		return null;
	}
	static warning(): AlertType {
		return new AlertType('warning');
	}
	static critical(): AlertType {
		return new AlertType('critical');
	}
	static exceeded(): AlertType {
		return new AlertType('exceeded');
	}
	equals(object: AlertType): boolean {
		return object._status === this.status;
	}
	get status(): Status {
		return this._status;
	}
}
