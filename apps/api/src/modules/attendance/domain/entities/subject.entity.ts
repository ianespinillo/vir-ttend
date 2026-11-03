export class Subject {
	private readonly _id: string;
	private readonly _courseId: string;
	private readonly _name: string;
	private readonly _teacherId: string;
	private readonly _tenantId: string;
	private readonly _hasOwnAttendance: boolean;
	private constructor(
		id: string,
		courseId: string,
		subjectName: string,
		teacherId: string,
		tenantId = '',
		hasOwnAttendance = true,
	) {
		this._id = id;
		this._courseId = courseId;
		this._name = subjectName;
		this._teacherId = teacherId;
		this._tenantId = tenantId;
		this._hasOwnAttendance = hasOwnAttendance;
	}
	static reconstitute(
		id: string,
		courseId: string,
		subjectName: string,
		teacherId: string,
		tenantId = '',
		hasOwnAttendance = true,
	) {
		return new Subject(
			id,
			courseId,
			subjectName,
			teacherId,
			tenantId,
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
}
