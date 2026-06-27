import { randomUUID } from 'node:crypto';
import { AttendanceRecordId } from '../value-objects/attendance-record-id.vo';
import { JustificationReason } from '../value-objects/justification-reason.vo';

interface CreateProps {
	attendanceRecordId: string;
	reason: string;
	notes?: string;
	createdBy: string;
}

interface ReconstituteProps {
	id: string;
	attendanceRecordId: string;
	reason: string;
	notes?: string;
	createdBy: string;
	createdAt: Date;
}

interface ConstructorProps {
	id: string;
	attendanceRecordId: AttendanceRecordId;
	reason: JustificationReason;
	notes?: string;
	createdBy: string;
	createdAt: Date;
}

export class Justification {
	private readonly _id: string;
	private readonly _attendanceRecordId: AttendanceRecordId;
	private readonly _reason: JustificationReason;
	private readonly _notes?: string;
	private readonly _createdBy: string;
	private readonly _createdAt: Date;

	private constructor(props: ConstructorProps) {
		this._id = props.id;
		this._attendanceRecordId = props.attendanceRecordId;
		this._reason = props.reason;
		this._notes = props.notes;
		this._createdBy = props.createdBy;
		this._createdAt = props.createdAt;
	}

	static create(props: CreateProps): Justification {
		return new Justification({
			id: randomUUID(),
			attendanceRecordId: new AttendanceRecordId(props.attendanceRecordId),
			reason: new JustificationReason(props.reason),
			notes: props.notes,
			createdBy: props.createdBy,
			createdAt: new Date(),
		});
	}

	static reconstitute(props: ReconstituteProps): Justification {
		return new Justification({
			...props,
			attendanceRecordId: new AttendanceRecordId(props.attendanceRecordId),
			reason: new JustificationReason(props.reason),
		});
	}

	get id(): string {
		return this._id;
	}

	get attendanceRecordId(): AttendanceRecordId {
		return this._attendanceRecordId;
	}

	get reason(): JustificationReason {
		return this._reason;
	}

	get notes(): string | undefined {
		return this._notes;
	}

	get createdBy(): string {
		return this._createdBy;
	}

	get createdAt(): Date {
		return this._createdAt;
	}
}
