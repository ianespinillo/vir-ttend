// schedule-slot.entity.ts
import { randomUUID } from 'node:crypto';
import {
	COMMISSION_NUMBERS,
	CommissionNumber,
	DAYOFWEEK as DayOfWeek,
} from '@repo/common';

interface CreateProps {
	subjectId: string;
	courseId: string;
	dayOfWeek: DayOfWeek;
	startTime: string; // HH:mm
	endTime: string; // HH:mm
	/** Workshop commission this slot targets; null/undefined = both commissions. */
	commissionNumber?: CommissionNumber | null;
}

interface ConstructorProps
	extends Omit<CreateProps, 'courseId' | 'commissionNumber'> {
	id: string;
	courseId?: string;
	createdAt: Date;
	commissionNumber?: CommissionNumber | null;
}

export interface ReconstituteProps extends ConstructorProps {}

export class ScheduleSlot {
	private readonly _id: string;
	private readonly _subjectId: string;
	private readonly _courseId: string;
	private readonly _dayOfWeek: DayOfWeek;
	private readonly _startTime: string;
	private readonly _endTime: string;
	private readonly _commissionNumber: CommissionNumber | null;
	private readonly _createdAt: Date;

	private constructor(props: ConstructorProps) {
		this._id = props.id;
		this._subjectId = props.subjectId;
		this._courseId = props.courseId;
		this._dayOfWeek = props.dayOfWeek;
		this._startTime = props.startTime;
		this._endTime = props.endTime;
		this._commissionNumber = props.commissionNumber ?? null;
		this._createdAt = props.createdAt;
	}

	static create(props: CreateProps): ScheduleSlot {
		if (props.startTime >= props.endTime) {
			throw new Error('Start time must be before end time');
		}
		if (
			props.commissionNumber !== undefined &&
			props.commissionNumber !== null &&
			!(COMMISSION_NUMBERS as readonly number[]).includes(props.commissionNumber)
		) {
			throw new Error('Commission number must be 1 or 2');
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
	get courseId(): string {
		return this._courseId;
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
	get commissionNumber(): CommissionNumber | null {
		return this._commissionNumber;
	}
	get createdAt(): Date {
		return this._createdAt;
	}

	/** True when both slots can involve the same students (same commission or either covers both). */
	sharesStudentsWith(other: ScheduleSlot): boolean {
		return (
			this._commissionNumber === null ||
			other.commissionNumber === null ||
			this._commissionNumber === other.commissionNumber
		);
	}

	overlaps(other: ScheduleSlot): boolean {
		if (this._dayOfWeek !== other.dayOfWeek) return false;
		if (!this.sharesStudentsWith(other)) return false;
		return this._startTime < other.endTime && this._endTime > other.startTime;
	}
}
