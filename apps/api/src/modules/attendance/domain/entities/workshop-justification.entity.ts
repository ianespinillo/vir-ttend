import { randomUUID } from 'node:crypto';
import { AttendanceRecordId } from '../value-objects/attendance-record-id.vo';
import { JustificationReason } from '../value-objects/justification-reason.vo';

interface CreateProps {
	workshopAttendanceRecordId: string;
	reason: string;
	notes?: string;
	createdBy: string;
}

interface ReconstituteProps extends CreateProps {
	id: string;
	createdAt: Date;
}

interface ConstructorProps {
	id: string;
	workshopAttendanceRecordId: AttendanceRecordId;
	reason: JustificationReason;
	notes?: string;
	createdBy: string;
	createdAt: Date;
}

/** Justification of a workshop attendance record (1:1 with the record). */
export class WorkshopJustification {
	private readonly _id: string;
	private readonly _workshopAttendanceRecordId: AttendanceRecordId;
	private readonly _reason: JustificationReason;
	private readonly _notes?: string;
	private readonly _createdBy: string;
	private readonly _createdAt: Date;

	private constructor(props: ConstructorProps) {
		this._id = props.id;
		this._workshopAttendanceRecordId = props.workshopAttendanceRecordId;
		this._reason = props.reason;
		this._notes = props.notes;
		this._createdBy = props.createdBy;
		this._createdAt = props.createdAt;
	}

	static create(props: CreateProps): WorkshopJustification {
		return new WorkshopJustification({
			id: randomUUID(),
			workshopAttendanceRecordId: new AttendanceRecordId(
				props.workshopAttendanceRecordId,
			),
			reason: new JustificationReason(props.reason),
			notes: props.notes,
			createdBy: props.createdBy,
			createdAt: new Date(),
		});
	}

	static reconstitute(props: ReconstituteProps): WorkshopJustification {
		return new WorkshopJustification({
			...props,
			workshopAttendanceRecordId: new AttendanceRecordId(
				props.workshopAttendanceRecordId,
			),
			reason: new JustificationReason(props.reason),
		});
	}

	get id(): string {
		return this._id;
	}
	get workshopAttendanceRecordId(): AttendanceRecordId {
		return this._workshopAttendanceRecordId;
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
