import { DAYOFWEEK } from '@repo/common';

export class ScheduleSlot {
	private readonly _subjectId: string;
	private readonly _dayOfWeek: DAYOFWEEK;
	private readonly _startTime: string;
	private readonly _endTime: string;

	private constructor(
		subjectId: string,
		dayOfWeek: DAYOFWEEK,
		startTime: string,
		endTime: string,
	) {
		this._subjectId = subjectId;
		this._dayOfWeek = dayOfWeek;
		this._startTime = startTime;
		this._endTime = endTime;
	}
	public static reconstitute(
		subjectId: string,
		dayOfWeek: DAYOFWEEK,
		startTime: string,
		endTime: string,
	) {
		return new ScheduleSlot(subjectId, dayOfWeek, startTime, endTime);
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
}
