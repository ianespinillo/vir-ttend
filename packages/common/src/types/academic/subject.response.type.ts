import type {
	CommissionNumber,
	SubjectKindType,
} from '../../constants/subject-kind.enum.js';

/** Teacher of a subject for one workshop commission (null = the whole subject). */
export interface ISubjectTeacherResponse {
	commissionNumber: CommissionNumber | null;
	teacherId?: string;
	/** Display name: the account's name, or the manual name when there is no account. */
	teacherName?: string;
}

export interface ISubjectResponse {
	id: string;
	courseId?: string;
	name: string;
	area: string;
	weeklyHours: number;
	/** Always sent by the API; optional here so existing mocks keep compiling. Absent = theory. */
	kind?: SubjectKindType;
	/** Compat: the whole-subject teacher, else commission 1's (older clients read only these). */
	teacherId?: string;
	teacherName?: string;
	/**
	 * Only sent in teacher subject lists. False for a theory subject of a
	 * workshop-only course (attendance is the workshop one). Absent = true.
	 */
	hasSubjectAttendance?: boolean;
	/** Teacher per commission; absent in older payloads and mocks. */
	teachers?: ISubjectTeacherResponse[];
}
