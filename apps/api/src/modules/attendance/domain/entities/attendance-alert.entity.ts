import { randomUUID } from 'node:crypto';
import { AlertType } from '../value-objects/alert-type.vo';

interface ConstructorProperties {
	id: string;
	studentId: string;
	courseId: string;
	tenantId: string;
	academicYearId: string;
	alertType: AlertType;
	absenceCount: number;
	threshold: number;
	seenBy?: string;
	seenAt?: Date;
	createdAt: Date;
}
interface CreateProperties {
	studentId: string;
	courseId: string;
	tenantId: string;
	academicYearId: string;
	absenceCount: number;
	threshold: number;
	alertType: AlertType;
	seenBy?: string;
	seenAt?: Date;
}
interface ReconstituteProperties extends CreateProperties {
	id: string;
	createdAt: Date;
}

export class AttendanceAlert {
	private readonly _id: string;
	private readonly _studentId: string;
	private readonly _courseId: string;
	private readonly _tenantId: string;
	private readonly _academicYearId: string;
	private readonly _alertType: AlertType;
	private readonly _absenceCount: number;
	private readonly _threshold: number;
	private readonly _createdAt: Date;
	private _seenBy?: string;
	private _seenAt?: Date;

	private constructor(props: ConstructorProperties) {
		this._id = props.id;
		this._studentId = props.studentId;
		this._courseId = props.courseId;
		this._tenantId = props.tenantId;
		this._academicYearId = props.academicYearId;
		this._alertType = props.alertType;
		this._absenceCount = props.absenceCount;
		this._threshold = props.threshold;
		this._createdAt = props.createdAt;
		this._seenBy = props.seenBy;
		this._seenAt = props.seenAt;
	}
	static create(props: CreateProperties) {
		return new AttendanceAlert({
			...props,
			id: randomUUID(),
			createdAt: new Date(),
		});
	}
	static reconstitute(props: ReconstituteProperties): AttendanceAlert {
		return new AttendanceAlert(props);
	}
	markAsSeen(userId: string): void {
		if (this._seenBy) throw new Error('Attendance alert already seen');
		this._seenBy = userId;
		this._seenAt = new Date();
	}

	get tenantId(): string {
		return this._tenantId;
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

	get academicYearId(): string {
		return this._academicYearId;
	}

	get alertType(): AlertType {
		return this._alertType;
	}

	/** Weighted absences of the student when the alert was raised. */
	get absenceCount(): number {
		return this._absenceCount;
	}

	/** Absence threshold (10, 20 or the student's cap) the alert was raised for. */
	get threshold(): number {
		return this._threshold;
	}

	get seenBy(): string | undefined {
		return this._seenBy;
	}

	get seenAt(): Date | undefined {
		return this._seenAt;
	}

	get createdAt(): Date {
		return this._createdAt;
	}
}
