import { randomUUID } from 'node:crypto';

interface CreateProps {
	tenantId: string;
	workshopCommissionId: string;
	date: Date;
	reason?: string;
	createdBy: string;
}

interface ReconstituteProps extends CreateProps {
	id: string;
	createdAt: Date;
}

/**
 * The workshop of a commission was not held on a date, for example because the
 * teacher was absent. A class-level fact: no student has a status for that day.
 */
export class WorkshopSessionNotHeld {
	private readonly _id: string;
	private readonly _tenantId: string;
	private readonly _workshopCommissionId: string;
	private readonly _date: Date;
	private _reason?: string;
	private readonly _createdBy: string;
	private readonly _createdAt: Date;

	private constructor(props: ReconstituteProps) {
		this._id = props.id;
		this._tenantId = props.tenantId;
		this._workshopCommissionId = props.workshopCommissionId;
		this._date = props.date;
		this._reason = props.reason;
		this._createdBy = props.createdBy;
		this._createdAt = props.createdAt;
	}

	static create(props: CreateProps): WorkshopSessionNotHeld {
		return new WorkshopSessionNotHeld({
			...props,
			id: randomUUID(),
			createdAt: new Date(),
		});
	}

	static reconstitute(props: ReconstituteProps): WorkshopSessionNotHeld {
		return new WorkshopSessionNotHeld(props);
	}

	/** Replaces the reason; `undefined` clears it. */
	changeReason(reason?: string): void {
		this._reason = reason;
	}

	get id(): string {
		return this._id;
	}

	get tenantId(): string {
		return this._tenantId;
	}

	get workshopCommissionId(): string {
		return this._workshopCommissionId;
	}

	get date(): Date {
		return this._date;
	}

	get reason(): string | undefined {
		return this._reason;
	}

	get createdBy(): string {
		return this._createdBy;
	}

	get createdAt(): Date {
		return this._createdAt;
	}
}
