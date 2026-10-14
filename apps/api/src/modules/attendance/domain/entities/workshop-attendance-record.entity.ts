import { randomUUID } from 'node:crypto';
import { AttendanceStatus } from '@repo/common';

interface CreateProps {
	tenantId: string;
	workshopCommissionId: string;
	courseId: string;
	studentId: string;
	date: Date;
	status: AttendanceStatus;
	editedBy: string;
}

export interface WorkshopAttendanceReconstituteProps extends CreateProps {
	id: string;
	editedAt: Date;
	createdAt: Date;
}

/** A student's attendance at the workshop of a commission on a given date. */
export class WorkshopAttendanceRecord {
	private readonly _id: string;
	private readonly _tenantId: string;
	private readonly _workshopCommissionId: string;
	private readonly _courseId: string;
	private readonly _studentId: string;
	private readonly _date: Date;
	private _status: AttendanceStatus;
	private _editedBy: string;
	private _editedAt: Date;
	private readonly _createdAt: Date;

	private constructor(props: WorkshopAttendanceReconstituteProps) {
		this._id = props.id;
		this._tenantId = props.tenantId;
		this._workshopCommissionId = props.workshopCommissionId;
		this._courseId = props.courseId;
		this._studentId = props.studentId;
		this._date = props.date;
		this._status = props.status;
		this._editedBy = props.editedBy;
		this._editedAt = props.editedAt;
		this._createdAt = props.createdAt;
	}

	static create(props: CreateProps): WorkshopAttendanceRecord {
		const now = new Date();
		return new WorkshopAttendanceRecord({
			...props,
			id: randomUUID(),
			editedAt: now,
			createdAt: now,
		});
	}

	static reconstitute(
		props: WorkshopAttendanceReconstituteProps,
	): WorkshopAttendanceRecord {
		return new WorkshopAttendanceRecord(props);
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
	get courseId(): string {
		return this._courseId;
	}
	get studentId(): string {
		return this._studentId;
	}
	get date(): Date {
		return this._date;
	}
	get status(): AttendanceStatus {
		return this._status;
	}
	get editedBy(): string {
		return this._editedBy;
	}
	get editedAt(): Date {
		return this._editedAt;
	}
	get createdAt(): Date {
		return this._createdAt;
	}

	updateStatus(status: AttendanceStatus, editedBy: string): void {
		this._status = status;
		this._editedBy = editedBy;
		this._editedAt = new Date();
	}
}
