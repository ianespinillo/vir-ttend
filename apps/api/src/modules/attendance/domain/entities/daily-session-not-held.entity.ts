import { randomUUID } from 'node:crypto';

interface CreateProps {
	tenantId: string;
	courseId: string;
	date: Date;
	reason?: string;
	createdBy: string;
}

interface ReconstituteProps extends CreateProps {
	id: string;
	createdAt: Date;
}

/**
 * The theory (daily) shift of a course was not held on a date, for example
 * because the teacher was absent. A class-level fact: no student has a status
 * for that day and it does not count as a day given.
 */
export class DailySessionNotHeld {
	private readonly _id: string;
	private readonly _tenantId: string;
	private readonly _courseId: string;
	private readonly _date: Date;
	private _reason?: string;
	private readonly _createdBy: string;
	private readonly _createdAt: Date;

	private constructor(props: ReconstituteProps) {
		this._id = props.id;
		this._tenantId = props.tenantId;
		this._courseId = props.courseId;
		this._date = props.date;
		this._reason = props.reason;
		this._createdBy = props.createdBy;
		this._createdAt = props.createdAt;
	}

	static create(props: CreateProps): DailySessionNotHeld {
		return new DailySessionNotHeld({
			...props,
			id: randomUUID(),
			createdAt: new Date(),
		});
	}

	static reconstitute(props: ReconstituteProps): DailySessionNotHeld {
		return new DailySessionNotHeld(props);
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

	get courseId(): string {
		return this._courseId;
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
