import { randomUUID } from 'node:crypto';
import { AttendanceStatus } from '@repo/common';

interface CreateProps {
	tenantId: string;
	studentId: string;
	courseId: string;
	subjectId?: string;
	date: Date;
	status: AttendanceStatus;
	editedBy: string;
}

export interface ReconstituteProps {
	id: string;
	tenantId: string;
	studentId: string;
	courseId: string;
	subjectId?: string;
	date: Date;
	status: AttendanceStatus;
	editedBy: string;
	editedAt: Date;
	createdAt: Date;
}

export class AttendanceRecord {
	private readonly _id: string;
	private readonly _tenantId: string;
	private readonly _studentId: string;
	private readonly _courseId: string;
	private readonly _subjectId?: string;
	private readonly _date: Date;
	private _status: AttendanceStatus;
	private _editedBy: string;
	private _editedAt: Date;
	private readonly _createdAt: Date;

	private constructor(props: ReconstituteProps) {
		this._id = props.id;
		this._tenantId = props.tenantId;
		this._studentId = props.studentId;
		this._courseId = props.courseId;
		this._subjectId = props.subjectId;
		this._date = props.date;
		this._status = props.status;
		this._editedBy = props.editedBy;
		this._editedAt = props.editedAt;
		this._createdAt = props.createdAt;
	}

	static create(props: CreateProps): AttendanceRecord {
		const now = new Date();
		return new AttendanceRecord({
			id: randomUUID(),
			tenantId: props.tenantId,
			studentId: props.studentId,
			courseId: props.courseId,
			subjectId: props.subjectId,
			date: props.date,
			status: props.status,
			editedBy: props.editedBy,
			editedAt: now,
			createdAt: now,
		});
	}

	static reconstitute(props: ReconstituteProps): AttendanceRecord {
		return new AttendanceRecord(props);
	}

	get id(): string {
		return this._id;
	}

	get tenantId(): string {
		return this._tenantId;
	}

	get studentId(): string {
		return this._studentId;
	}

	get courseId(): string {
		return this._courseId;
	}

	get subjectId(): string | undefined {
		return this._subjectId;
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

	get isDaily(): boolean {
		return this._subjectId === undefined;
	}

	get isSubject(): boolean {
		return this._subjectId !== undefined;
	}

	updateStatus(status: AttendanceStatus, editedBy: string): void {
		this._status = status;
		this._editedBy = editedBy;
		this._editedAt = new Date();
	}
}
