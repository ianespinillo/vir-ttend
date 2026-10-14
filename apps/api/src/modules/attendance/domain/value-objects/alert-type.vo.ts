type Status = 'warning' | 'critical' | 'exceeded';
export class AlertType {
	private readonly _status: Status;
	private constructor(status: Status) {
		this._status = status;
	}
	static fromStatus(status: string): AlertType {
		switch (status) {
			case 'warning':
				return AlertType.warning();
			case 'critical':
				return AlertType.critical();
			case 'exceeded':
				return AlertType.exceeded();
			default:
				throw new Error(`Unknown alert type: ${status}`);
		}
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
