/**
 * Demo store — domain types.
 *
 * The demo app (apps/demo) is a self-contained replica of the vir-ttend product:
 * no database, no network. The store mirrors the response contracts of
 * @repo/common so the real feature components from @repo/ui can be fed with the
 * exact same shapes they receive from the API-backed hooks.
 *
 * Business rules seeded (source: doc/planning/demo-data-seeds-plan.md §2.3):
 * - Absence threshold: 15%
 * - Equivalency: 3 tardanzas (lateness) = 1 inasistencia (absence)
 * - Warning band starts at 10% (two thirds of the 15% threshold)
 * - Primaria registers attendance daily per course (subjectId omitted)
 * - Secundaria registers attendance per subject (subjectId set)
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
export const DEMO_STORAGE_KEY = 'virttend-demo-state:v1';

/** Schema version of the persisted DemoState (bump to invalidate old states). */
export const STORAGE_SCHEMA_VERSION = 1;

/** Fixed "today" of the demo (demos MUST be deterministic, never Date.now()). */
export const DEMO_TODAY = '2026-06-19';

/** Default credentials shown on the landing page (informational). */
export const DEMO_DEFAULT_PASSWORD = 'Demo1234!';

/** Absence warning band: pct >= 10 is at risk (two thirds of the threshold). */
export const DEMO_ABSENCE_WARNING_PERCENT = 10;

/** Absence critical band: pct >= 15 exceeds the seeded threshold. */
export const DEMO_ABSENCE_CRITICAL_PERCENT = 15;

/** 3 tardanzas = 1 inasistencia (seeds plan equivalence). */
export const DEMO_LATE_TO_ABSENCE = 3;

/** Academic year 2026 window. */
export const DEMO_ACADEMIC_START = '2026-03-02';
export const DEMO_ACADEMIC_END = '2026-12-18';

/** Number of seeded business days of attendance. */
export const DEMO_ATTENDANCE_DAYS = 30;

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

/** Per-student attendance counts over a set of records. */
export interface StudentAttendanceTotals {
	present: number;
	absent: number;
	late: number;
	justified: number;
	totalSlots: number;
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
}

export interface UpdateSubjectInput {
	courseId?: string;
	name?: string;
	area?: string;
	weeklyHours?: number;
	teacherId?: string;
}

export interface CreateAnnouncementInput extends CreateAnnouncementPayload {
	authorName: string;
}

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
