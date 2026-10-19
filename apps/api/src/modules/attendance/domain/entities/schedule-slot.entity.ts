import { CommissionNumber, DAYOFWEEK } from '@repo/common';

export class ScheduleSlot {
	private readonly _subjectId: string;
	private readonly _dayOfWeek: DAYOFWEEK;
	private readonly _startTime: string;
	private readonly _endTime: string;
	private readonly _commissionNumber: CommissionNumber | null;

	private constructor(
		subjectId: string,
		dayOfWeek: DAYOFWEEK,
		startTime: string,
		endTime: string,
		commissionNumber: CommissionNumber | null,
	) {
		this._subjectId = subjectId;
		this._dayOfWeek = dayOfWeek;
		this._startTime = startTime;
		this._endTime = endTime;
		this._commissionNumber = commissionNumber;
	}
	public static reconstitute(
		subjectId: string,
		dayOfWeek: DAYOFWEEK,
		startTime: string,
		endTime: string,
		commissionNumber: CommissionNumber | null = null,
	) {
		return new ScheduleSlot(
			subjectId,
			dayOfWeek,
			startTime,
			endTime,
			commissionNumber,
		);
	}
	get subjectId(): string {
		return this._subjectId;
	}

	get dayOfWeek(): DAYOFWEEK {
		return this._dayOfWeek;
	}
	get startTime(): string {
		return this._startTime;
	}

	get endTime(): string {
		return this._endTime;
	}

	/** Workshop commission the slot targets; `null` targets the whole course. */
	get commissionNumber(): CommissionNumber | null {
		return this._commissionNumber;
	}
}
