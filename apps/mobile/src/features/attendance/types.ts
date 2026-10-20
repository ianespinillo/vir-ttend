// Shapes of the API payloads used by the mobile app (already unwrapped from
// the `{ success, data, timeStamp }` envelope by `api.ts`).

export type AttendanceStatus =
	| 'present'
	| 'absent'
	| 'late'
	| 'late_beyond_tolerance';

/** Statuses the API can return; mobile only edits `AttendanceStatus`. */
export type RecordedAttendanceStatus = AttendanceStatus | 'justified';

export type ClassWeekday =
	| 'monday'
	| 'tuesday'
	| 'wednesday'
	| 'thursday'
	| 'friday';

export interface AcademicYear {
	id: string;
	year: number;
	isActive: boolean;
	/** ISO date-time of the first day of the school year (UTC midnight). */
	startDate?: string;
}

/** One course of `GET /dashboard`. */
export interface CourseSnapshot {
	courseId: string;
	courseName: string;
	level?: string;
	shift?: string;
	totalStudents?: number;
	present?: number;
	absent?: number;
	late?: number;
	notRecorded?: number;
	attendancePercent?: number;
	/** 7th year technical: no daily attendance, only workshop attendance. */
	workshopOnly?: boolean;
}

/** One course of `GET /courses/by-preceptor`. */
export interface PreceptorCourse {
	id: string;
	fullName: string;
	level?: string;
	yearNumber?: number;
	shift?: string;
}

/** Normalised course row used by the home screen and the preload. */
export type CourseListItem = CourseSnapshot;

export interface StudentItem {
	id: string;
	firstName: string;
	lastName: string;
	fullName?: string;
	documentNumber?: string;
	courseId?: string;
	status?: string;
}

/** Justification attached by the API to a `justified` record. */
export interface AttendanceJustification {
	id: string;
	reason: string;
	notes?: string;
	createdBy?: string;
	createdAt?: string;
}

export interface AttendanceRecordItem {
	id?: string;
	studentId: string;
	studentName?: string;
	status?: RecordedAttendanceStatus;
	/** ISO date of the record; present on history reads. */
	date?: string;
	justification?: AttendanceJustification;
}

/** `GET /attendance/daily` (full roster, `status` unset when not recorded). */
export interface DailyAttendance {
	courseId: string;
	date?: string;
	records: AttendanceRecordItem[];
}

export interface SubjectSlot {
	dayOfWeek: ClassWeekday;
	startTime: string;
	endTime: string;
}

/** One subject of `GET /subjects/mine` (whole week of slots). */
export interface MySubject {
	subjectId: string;
	name: string;
	area?: string;
	courseId: string;
	courseName: string;
	slots: SubjectSlot[];
}

/** One commission of `GET /attendance/workshop/my-commissions`. */
export interface MyWorkshopCommission {
	commissionId: string;
	/** Commission code derived from the course, e.g. `141`. */
	code: string;
	number: number;
	courseId: string;
	/** Course name, e.g. `1° 4°`. */
	courseName: string;
	hasWorkshopToday: boolean;
}

/**
 * `GET /attendance/workshop` mapped to the shapes the sheets share: the roster
 * of the commission, `status` unset when not recorded.
 */
export interface WorkshopAttendance {
	commissionId: string;
	date: string;
	records: AttendanceRecordItem[];
}

/** `GET /attendance/subject` (full roster, `status` unset when not recorded). */
export interface SubjectAttendance {
	subjectId: string;
	subjectName: string;
	courseId: string;
	date: string;
	records: AttendanceRecordItem[];
}
