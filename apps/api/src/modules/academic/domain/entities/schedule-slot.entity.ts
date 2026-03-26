// schedule-slot.entity.ts
import { randomUUID } from 'node:crypto';
import { DAYOFWEEK as DayOfWeek } from '@repo/common';

interface CreateProps {
	subjectId: string;
	dayOfWeek: DayOfWeek;
	startTime: string; // HH:mm
	endTime: string; // HH:mm
}

interface ConstructorProps extends CreateProps {
	id: string;
	createdAt: Date;
}

export interface ReconstituteProps extends ConstructorProps {}

export class ScheduleSlot {
	private readonly _id: string;
	private readonly _subjectId: string;
	private readonly _dayOfWeek: DayOfWeek;
	private readonly _startTime: string;
	private readonly _endTime: string;
	private readonly _createdAt: Date;

	private constructor(props: ConstructorProps) {
		this._id = props.id;
		this._subjectId = props.subjectId;
		this._dayOfWeek = props.dayOfWeek;
		this._startTime = props.startTime;
		this._endTime = props.endTime;
		this._createdAt = props.createdAt;
	}

	static create(props: CreateProps): ScheduleSlot {
		if (props.startTime >= props.endTime) {
			throw new Error('Start time must be before end time');
		}
		return new ScheduleSlot({
			id: randomUUID(),
			createdAt: new Date(),
			...props,
		});
	}

	static reconstitute(props: ReconstituteProps): ScheduleSlot {
		return new ScheduleSlot(props);
	}

	get id(): string {
		return this._id;
	}
	get subjectId(): string {
		return this._subjectId;
	}
	get dayOfWeek(): DayOfWeek {
		return this._dayOfWeek;
	}
	get startTime(): string {
		return this._startTime;
	}
	get endTime(): string {
		return this._endTime;
	}
	get createdAt(): Date {
		return this._createdAt;
	}

	overlaps(other: ScheduleSlot): boolean {
		if (this._dayOfWeek !== other.dayOfWeek) return false;
		return this._startTime < other.endTime && this._endTime > other.startTime;
	}
}
