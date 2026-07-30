import { AttendanceStatus } from '@repo/common';

interface ReconstituteParams {
	courseId: string;
	id: string;
	studentId: string;
	status: AttendanceStatus;
	date: Date;
}
export class AttendanceRecord {
	private readonly _id: string;
	private readonly _studentId: string;
	private readonly _courseId: string;
	private readonly _date: Date;
	private readonly _status: AttendanceStatus;

	private constructor(props: ReconstituteParams) {
		this._id = props.id;
		this._studentId = props.studentId;
		this._courseId = props.courseId;
		this._status = props.status;
		this._date = props.date;
	}
	static reconstitute(params: ReconstituteParams) {
		return new AttendanceRecord(params);
	}

	get date(): Date {
		return this._date;
	}

	get id(): string {
		return this._id;
	}

	get studentId(): string {
		return this._studentId;
	}

	get courseId(): string {
		return this._courseId;
	}

	get status(): AttendanceStatus {
		return this._status;
	}
}
