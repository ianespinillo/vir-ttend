import { CommissionNumber } from '@repo/common';

/** Commissions a user teaches in a subject: 'all' (whole subject) or the listed ones. */
export type TaughtCommissions = 'all' | CommissionNumber[];

/** A teacher of the subject; a null commission covers the whole subject. */
export interface SubjectTeacher {
	readonly commissionNumber: CommissionNumber | null;
	readonly teacherId: string;
}

export class Subject {
	private readonly _id: string;
	private readonly _courseId: string;
	private readonly _name: string;
	private readonly _teacherId: string;
	private readonly _tenantId: string;
	private readonly _hasOwnAttendance: boolean;
	private readonly _teachers: readonly SubjectTeacher[];
	private constructor(
		id: string,
		courseId: string,
		subjectName: string,
		teacherId: string,
		tenantId = '',
		teachers?: readonly SubjectTeacher[],
		hasOwnAttendance = true,
	) {
		this._id = id;
		this._courseId = courseId;
		this._name = subjectName;
		this._teacherId = teacherId;
		this._tenantId = tenantId;
		this._hasOwnAttendance = hasOwnAttendance;
		this._teachers =
			teachers ?? (teacherId ? [{ commissionNumber: null, teacherId }] : []);
	}
	/**
	 * @param teachers every teacher assignment; when omitted, `teacherId` is
	 * taken as the teacher of the whole subject.
	 */
	static reconstitute(
		id: string,
		courseId: string,
		subjectName: string,
		teacherId: string,
		tenantId = '',
		teachers?: readonly SubjectTeacher[],
		hasOwnAttendance = true,
	) {
		return new Subject(
			id,
			courseId,
			subjectName,
			teacherId,
			tenantId,
			teachers,
			hasOwnAttendance,
		);
	}

	get name(): string {
		return this._name;
	}

	get id(): string {
		return this._id;
	}

	get courseId(): string {
		return this._courseId;
	}

	/** The single teacher older callers know: whole subject, else commission 1's. */
	get teacherId(): string {
		return this._teacherId;
	}

	get tenantId(): string {
		return this._tenantId;
	}

	/**
	 * False for a theory subject of a workshop-only course: it is taught in the
	 * workshop shift and its attendance is the workshop one.
	 */
	get hasOwnAttendance(): boolean {
		return this._hasOwnAttendance;
	}

	get teachers(): readonly SubjectTeacher[] {
		return this._teachers;
	}

	/** Commissions this user teaches; [] when not a teacher of the subject. */
	commissionsTaughtBy(userId: string): TaughtCommissions {
		const own = this._teachers.filter((t) => t.teacherId === userId);
		if (own.some((t) => t.commissionNumber === null)) return 'all';
		return own.map((t) => t.commissionNumber as CommissionNumber);
	}

	isTaughtBy(userId: string): boolean {
		const taught = this.commissionsTaughtBy(userId);
		return taught === 'all' || taught.length > 0;
	}
}
