/**
 * Demo store — domain types.
 *
 * The demo app (apps/demo) is a self-contained replica of the vir-ttend product:
 * no database, no network. The store mirrors the response contracts of
 * @repo/common so the real feature components from @repo/ui can be fed with the
 * exact same shapes they receive from the API-backed hooks.
 *
 * Business rules mirrored from the product (PBA Res. 1650/2024, Anexo 4):
 * - Absences are weighted: absent/justified = 1, late = 0.25, late beyond
 *   tolerance = 0.5; with a workshop (contraturno) shift each shift weighs 1/2
 *   and a school day never weighs more than 1.
 * - Alerts are raised when the weighted count reaches 10 (warning), 20
 *   (critical) or the institutional cap of 28 (exceeded).
 * - Primaria registers attendance daily per course (subjectId omitted)
 * - Secundaria registers daily attendance (preceptor) and per subject (teacher)
 * - Technical courses split into one or two workshop commissions; the 7th year
 *   is workshop-only (workshop attendance is its only attendance).
 */

import {
	ATTENDANCE_STATUS,
	ATTENDANCE_THRESHOLDS,
	type Alert,
	type AlertType,
	type AlertsCount,
	type AlertsListResponse,
	type Announcement,
	type AnnouncementsListResponse,
	type AttendanceMetrics,
	type AttendanceRecord,
	type AttendanceRecordJustification,
	type AttendanceStatus,
	type AvailableReportPeriod,
	COURSE_RISK_STATUS,
	type ChangePasswordPayload,
	type CourseSnapshot,
	type CourseSnapshotDetail,
	type CourseSummaryEntry,
	type CreateAnnouncementPayload,
	type CreateTenantPayload,
	type CreateUserPayload,
	type CreateUserResponse,
	DAYOFWEEK,
	type DailyAttendance,
	type DashboardMetrics,
	type ExportFormat,
	type IAcademicYearResponse,
	type ICourseDetailResponse,
	type ICourseResponse,
	type IScheduleSlotResponse,
	type IStudentDetailResponse,
	type IStudentResponse,
	type ISubjectResponse,
	type IUserWithMembershipResponse,
	type IWorkshopCommissionResponse,
	LEVEL,
	type LevelType,
	type MonthlyReport,
	type MonthlyReportStudent,
	type PreceptorDashboard,
	ROLES,
	type Roles,
	SHIFT,
	STUDENTSTATUS,
	type ShiftType,
	type StudentAtRisk,
	type StudentReport,
	type StudentReportStatus,
	type StudentStatus,
	type SubjectAttendanceMetrics,
	type SubjectAttendanceResponse,
	type SubjectHistoryResponse,
	type SubjectKindType,
	type SuperAdminAnalytics,
	type Tenant,
	type UpdateAnnouncementPayload,
	type UpdateUserPayload,
	type WeeklyTrendPoint,
} from '@repo/common';

// ---------------------------------------------------------------------------
// Re-exports (convenience for pages and wiring)
// ---------------------------------------------------------------------------

export {
	ATTENDANCE_STATUS,
	ATTENDANCE_THRESHOLDS,
	COURSE_RISK_STATUS,
	DAYOFWEEK,
	LEVEL,
	ROLES,
	SHIFT,
	STUDENTSTATUS,
};

export type {
	Alert,
	AlertType,
	AlertsCount,
	AlertsListResponse,
	Announcement,
	AnnouncementsListResponse,
	AttendanceMetrics,
	AttendanceRecord,
	AttendanceRecordJustification,
	AttendanceStatus,
	AvailableReportPeriod,
	ChangePasswordPayload,
	CourseSnapshot,
	CourseSnapshotDetail,
	CourseSummaryEntry,
	CreateAnnouncementPayload,
	CreateTenantPayload,
	CreateUserPayload,
	CreateUserResponse,
	DailyAttendance,
	DashboardMetrics,
	ExportFormat,
	IAcademicYearResponse,
	ICourseDetailResponse,
	ICourseResponse,
	IScheduleSlotResponse,
	IStudentDetailResponse,
	IStudentResponse,
	ISubjectResponse,
	IUserWithMembershipResponse,
	LevelType,
	MonthlyReport,
	MonthlyReportStudent,
	PreceptorDashboard,
	Roles,
	ShiftType,
	StudentAtRisk,
	StudentReport,
	StudentReportStatus,
	StudentStatus,
	SubjectAttendanceMetrics,
	SubjectAttendanceResponse,
	SubjectHistoryResponse,
	SuperAdminAnalytics,
	Tenant,
	UpdateAnnouncementPayload,
	UpdateUserPayload,
	WeeklyTrendPoint,
};

// ---------------------------------------------------------------------------
// Demo constants
// ---------------------------------------------------------------------------

/** localStorage key for the canonical demo state. */
export const DEMO_STORAGE_KEY = 'virttend-demo-state:v2';

/** Keys of older schemas: their state is discarded (and cleaned up) on load. */
export const LEGACY_STORAGE_KEYS: readonly string[] = [
	'virttend-demo-state:v1',
];

/** Schema version of the persisted DemoState (bump to invalidate old states). */
export const STORAGE_SCHEMA_VERSION = 2;

/** Fixed "today" of the demo (demos MUST be deterministic, never Date.now()). */
export const DEMO_TODAY = '2026-06-19';

/** Default credentials shown on the landing page (informational). */
export const DEMO_DEFAULT_PASSWORD = 'Demo1234!';

/** Weighted absence counts at which an alert is raised (Res. 1650/2024). */
export const DEMO_WARNING_ABSENCES = 10;
export const DEMO_CRITICAL_ABSENCES = 20;
/** Institutional absence cap per school year (the "exceeded" threshold). */
export const DEMO_ABSENCE_CAP = 28;

/** Academic year 2026 window. */
export const DEMO_ACADEMIC_START = '2026-03-02';
export const DEMO_ACADEMIC_END = '2026-12-18';

/** Number of seeded business days of attendance (about three school months). */
export const DEMO_ATTENDANCE_DAYS = 60;

/**
 * Deterministic "today" as a Date (new instance per call so multiple seed
 * generations stay value-equal while never sharing mutable state).
 */
export function demoTodayDate(): Date {
	return new Date(`${DEMO_TODAY}T12:00:00.000Z`);
}

// ---------------------------------------------------------------------------
// Demo domain types
// ---------------------------------------------------------------------------

/**
 * A user of the demo. Mirrors IUserWithMembershipResponse from @repo/common
 * (role + tenant inline). Passwords are intentionally NOT stored: the demo
 * always issues DEMO_DEFAULT_PASSWORD as temporary credential.
 */
export type DemoUser = IUserWithMembershipResponse;

/**
 * A student. Extends IStudentDetailResponse; birthDate is kept as an ISO
 * 'YYYY-MM-DD' string (same format the product forms accept).
 */
export interface DemoStudent extends IStudentDetailResponse {
	birthDate: string;
	/** Workshop commission the student attends (technical courses only). */
	workshopCommissionId?: string;
}

/** A workshop commission of a course (1 or 2 per course, technical schools). */
export interface DemoWorkshopCommission {
	id: string;
	courseId: string;
	number: 1 | 2;
	preceptorId: string | null;
}

/** One workshop attendance record (per commission student and date). */
export interface DemoWorkshopRecord {
	id: string;
	commissionId: string;
	courseId: string;
	studentId: string;
	studentName: string;
	status: AttendanceStatus;
	date: string;
}

/**
 * One attendance record. Structurally compatible with AttendanceRecord from
 * @repo/common, enriched with courseId for compact lookups.
 */
export interface DemoAttendanceRecord {
	id: string;
	studentId: string;
	studentName: string;
	status: AttendanceStatus;
	courseId: string;
	subjectId?: string;
	date: string;
	justification?: AttendanceRecordJustification;
}

/** Active demo session (which user + tenant the UI is showing). */
export interface DemoSessionState {
	userId: string | null;
	tenantId: string | null;
}

/** Profile shape returned by getProfile (mirrors the product's current user). */
export interface DemoCurrentUser {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: Roles;
	tenantId?: string;
	mustChangePassword: boolean;
	isImpersonating?: boolean;
	tenantName?: string;
}

/** Per-student attendance totals over a set of records (weighted absences). */
export interface StudentAttendanceTotals {
	present: number;
	/** Weighted absence total (0.25 steps). */
	absent: number;
	late: number;
	justified: number;
	/** Distinct days with a daily or workshop record (classes given). */
	daysGiven: number;
	absenceBreakdown: { daily: number; workshop: number };
}

/** Canonical in-memory demo state, persisted under DEMO_STORAGE_KEY. */
export interface DemoState {
	version: typeof STORAGE_SCHEMA_VERSION;
	tenants: Tenant[];
	users: DemoUser[];
	academicYears: IAcademicYearResponse[];
	courses: ICourseResponse[];
	subjects: ISubjectResponse[];
	schedules: IScheduleSlotResponse[];
	students: DemoStudent[];
	attendance: DemoAttendanceRecord[];
	/** Workshop commissions (technical courses). */
	workshopCommissions: DemoWorkshopCommission[];
	/** Workshop attendance, taken per commission. */
	workshopAttendance: DemoWorkshopRecord[];
	alerts: Alert[];
	announcements: Announcement[];
	/** userId -> ordered list of announcement ids already read. */
	announcementReads: Record<string, string[]>;
	session: DemoSessionState;
}

/** Generic paginated result, matching the product's list responses. */
export interface PaginatedResult<T> {
	items: T[];
	total: number;
	page: number;
	totalPages: number;
}

// ---------------------------------------------------------------------------
// Query / input shapes used by selectors and actions
// ---------------------------------------------------------------------------

export interface StudentsQuery {
	search?: string;
	courseId?: string;
	status?: StudentStatus | string;
	page?: number;
	limit?: number;
}

export interface UsersQuery {
	search?: string;
	role?: Roles | string;
	tenantId?: string;
	page?: number;
	limit?: number;
}

export interface AlertsQuery {
	page?: number;
	limit?: number;
	unseenOnly?: boolean;
}

export interface AnnouncementsQuery {
	status?: 'draft' | 'published';
	page?: number;
	limit?: number;
}

export interface CreateStudentInput {
	firstName: string;
	lastName: string;
	documentNumber: string;
	birthDate: string;
	courseId: string;
	tutorName: string;
	tutorPhone: string;
	tutorEmail?: string;
}

export interface UpdateStudentInput {
	firstName?: string;
	lastName?: string;
	documentNumber?: string;
	birthDate?: string;
	tutorName?: string;
	tutorPhone?: string;
	tutorEmail?: string;
}

export interface CreateCourseInput {
	academicYearId: string;
	level: LevelType;
	yearNumber: number;
	division: string;
	shift: ShiftType;
	preceptorId?: string;
}

export interface UpdateCourseInput {
	level?: LevelType;
	yearNumber?: number;
	division?: string;
	shift?: ShiftType;
	preceptorId?: string;
}

export interface CreateSubjectInput {
	courseId: string;
	name: string;
	area: string;
	weeklyHours: number;
	teacherId?: string;
	/** Teacher without a user account; ignored when teacherId is set. */
	teacherName?: string;
	kind?: SubjectKindType;
}

export interface UpdateSubjectInput {
	courseId?: string;
	name?: string;
	area?: string;
	weeklyHours?: number;
	teacherId?: string;
	teacherName?: string;
	kind?: SubjectKindType;
}

export interface CreateAnnouncementInput extends CreateAnnouncementPayload {
	authorName: string;
}

export type { IWorkshopCommissionResponse };

export interface AttendanceEntry {
	studentId: string;
	status: AttendanceStatus;
}

export interface CopyAttendanceInput {
	courseId?: string;
	subjectId?: string;
	targetDate: string;
	sourceDate?: string;
}

export interface JustifyInput {
	reason: string;
	notes?: string;
}

export type DayOfWeekValue = (typeof DAYOFWEEK)[keyof typeof DAYOFWEEK];
export type RiskStatusValue =
	(typeof COURSE_RISK_STATUS)[keyof typeof COURSE_RISK_STATUS];
