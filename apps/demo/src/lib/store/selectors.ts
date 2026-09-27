/**
 * Demo store — derived selectors.
 *
 * All selectors are pure functions of the demo state (plus explicit params),
 * mirroring the response contracts of @repo/common that the real feature
 * components consume. Math helpers are exported at the top so both the seed
 * generator (alerts consistency) and the tests share a single source of truth.
 */

import {
	ATTENDANCE_THRESHOLDS,
	type Alert,
	type AlertType,
	type AlertsCount,
	type AlertsListResponse,
	type Announcement,
	type AnnouncementsListResponse,
	type AttendanceRecord,
	type AvailableReportPeriod,
	COURSE_RISK_STATUS,
	type CourseSnapshot,
	type CourseSnapshotDetail,
	type CourseSummaryEntry,
	type DailyAttendance,
	type DashboardMetrics,
	type IAcademicYearResponse,
	type ICourseDetailResponse,
	type ICourseResponse,
	type IScheduleSlotResponse,
	type IStudentDetailResponse,
	type IStudentResponse,
	type ISubjectResponse,
	type IUserWithMembershipResponse,
	LEVEL,
	type MonthlyReport,
	type MonthlyReportStudent,
	type PreceptorDashboard,
	ROLES,
	type StudentReport,
	type StudentReportStatus,
	type SubjectAttendanceResponse,
	type SubjectHistoryResponse,
	type SuperAdminAnalytics,
	type Tenant,
	type WeeklyTrendPoint,
} from './types';
import {
	type AlertsQuery,
	type AnnouncementsQuery,
	DEMO_ABSENCE_CRITICAL_PERCENT,
	DEMO_ABSENCE_WARNING_PERCENT,
	DEMO_ATTENDANCE_DAYS,
	DEMO_LATE_TO_ABSENCE,
	DEMO_TODAY,
	type DemoAttendanceRecord,
	type DemoCurrentUser,
	type DemoState,
	type PaginatedResult,
	type StudentAttendanceTotals,
	type StudentsQuery,
	type UsersQuery,
	demoTodayDate,
} from './types';

// ---------------------------------------------------------------------------
// Math helpers (single source of truth: seeds + alerts + tests)
// ---------------------------------------------------------------------------

function countByStatus(records: DemoAttendanceRecord[]): {
	present: number;
	absent: number;
	late: number;
	justified: number;
} {
	return records.reduce(
		(counts, record) => {
			switch (record.status) {
				case 'absent':
					counts.absent += 1;
					break;
				case 'late':
					counts.late += 1;
					break;
				case 'justified':
					counts.justified += 1;
					break;
				default:
					counts.present += 1;
			}
			return counts;
		},
		{ present: 0, absent: 0, late: 0, justified: 0 },
	);
}

/** 3 tardanzas = 1 inasistencia (seeds plan). */
export function effectiveAbsenceCount(absent: number, late: number): number {
	return absent + Math.floor(late / DEMO_LATE_TO_ABSENCE);
}

/** % of absence rounded to 1 decimal (matches the report UI formatting). */
export function absencePercent(
	absent: number,
	late: number,
	totalSlots: number,
): number {
	if (totalSlots <= 0) return 0;
	return Number(
		((effectiveAbsenceCount(absent, late) / totalSlots) * 100).toFixed(1),
	);
}

/** No alerts below the warning band; warning < critical; else critical. */
export function absenceToAlertType(pct: number): AlertType | null {
	if (pct < DEMO_ABSENCE_WARNING_PERCENT) return null;
	if (pct < DEMO_ABSENCE_CRITICAL_PERCENT) return 'warning';
	return 'critical';
}

/** Report band (product UI: 'abajo' / 'en riesgo' / 'superado'). */
export function absenceToReportStatus(pct: number): StudentReportStatus {
	if (pct < DEMO_ABSENCE_WARNING_PERCENT) return 'ok';
	if (pct < DEMO_ABSENCE_CRITICAL_PERCENT) return 'at-risk';
	return 'exceeded';
}

/** Risk color like the product course snapshot (75/85 thresholds). */
export function courseRiskStatus(pct: number): COURSE_RISK_STATUS {
	if (pct >= ATTENDANCE_THRESHOLDS.CRITICAL) return COURSE_RISK_STATUS.CRITICAL;
	if (pct >= ATTENDANCE_THRESHOLDS.WARNING) return COURSE_RISK_STATUS.WARNING;
	return COURSE_RISK_STATUS.OK;
}

/** Last `count` business days ending at `endISODate`, ascending. */
export function generateLastBusinessDays(
	endISODate: string = DEMO_TODAY,
	count: number = DEMO_ATTENDANCE_DAYS,
	holidays: ReadonlySet<string> = new Set(['2026-05-25', '2026-07-09']),
): string[] {
	const days: string[] = [];
	const cursor = new Date(`${endISODate}T00:00:00.000Z`);
	while (days.length < count) {
		const dow = cursor.getUTCDay();
		const iso = cursor.toISOString().slice(0, 10);
		if (dow !== 0 && dow !== 6 && !holidays.has(iso)) {
			days.push(iso);
		}
		cursor.setUTCDate(cursor.getUTCDate() - 1);
	}
	return days.reverse();
}

/** Distinct ISO dates (YYYY-MM-DD) among inputs, ascending. */
export function distinctDates(dates: (string | Date | undefined)[]): string[] {
	const out: string[] = [];
	for (const date of dates) {
		if (!date) continue;
		const iso =
			typeof date === 'string'
				? date.slice(0, 10)
				: date.toISOString().slice(0, 10);
		if (!out.includes(iso)) out.push(iso);
	}
	return out.sort();
}

/** Monday (00:00 UTC) of the week containing an ISO date. */
export function mondayOfWeek(isoDate: string): Date {
	const date = new Date(`${isoDate}T00:00:00.000Z`);
	const day = date.getUTCDay(); // 0 = Sunday
	const diff = day === 0 ? -6 : 1 - day;
	date.setUTCDate(date.getUTCDate() + diff);
	return date;
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

const DEFAULT_PAGE_SIZE = 10;

export function paginate<T>(
	items: T[],
	page = 1,
	limit: number = DEFAULT_PAGE_SIZE,
): PaginatedResult<T> {
	const safePage = Math.max(1, page);
	const totalPages = Math.max(1, Math.ceil(items.length / limit));
	const currentPage = Math.min(safePage, totalPages);
	const start = (currentPage - 1) * limit;
	return {
		items: items.slice(start, start + limit),
		total: items.length,
		page: currentPage,
		totalPages,
	};
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

/** Students of a course (any status — the roster). */
export function getCourseStudents(
	state: DemoState,
	courseId: string,
): IStudentResponse[] {
	return state.students.filter((student) => student.courseId === courseId);
}

/** Raw roster for the store (typed, exposes tutors). */
export function getCourseStudentsDetailed(
	state: DemoState,
	courseId: string,
): DemoState['students'] {
	return state.students.filter((student) => student.courseId === courseId);
}

export function getStudents(
	state: DemoState,
	query: StudentsQuery = {},
): PaginatedResult<IStudentResponse> {
	const search = query.search?.trim().toLowerCase() ?? '';
	const filtered = state.students.filter((student) => {
		if (query.courseId && student.courseId !== query.courseId) return false;
		if (query.status && query.status !== 'ALL' && student.status !== query.status)
			return false;
		if (search) {
			const haystack =
				`${student.fullName} ${student.documentNumber}`.toLowerCase();
			if (!haystack.includes(search)) return false;
		}
		return true;
	});
	return paginate(filtered, query.page, query.limit ?? DEFAULT_PAGE_SIZE);
}

export function getStudentById(
	state: DemoState,
	studentId: string,
): IStudentDetailResponse | null {
	return state.students.find((student) => student.id === studentId) ?? null;
}

export function getStudentRecords(
	state: DemoState,
	studentId: string,
): DemoAttendanceRecord[] {
	return state.attendance.filter((record) => record.studentId === studentId);
}

export function getStudentAttendanceTotals(
	state: DemoState,
	studentId: string,
): StudentAttendanceTotals {
	const records = getStudentRecords(state, studentId);
	const { present, absent, late, justified } = countByStatus(records);
	return { present, absent, late, justified, totalSlots: records.length };
}

export function getStudentAbsencePercent(
	state: DemoState,
	studentId: string,
	totals?: StudentAttendanceTotals,
): number {
	const calculated = totals ?? getStudentAttendanceTotals(state, studentId);
	return absencePercent(
		calculated.absent,
		calculated.late,
		calculated.totalSlots,
	);
}

// ---------------------------------------------------------------------------
// Tenants & users
// ---------------------------------------------------------------------------

export function getTenants(state: DemoState): Tenant[] {
	return state.tenants;
}

export function getUsers(
	state: DemoState,
	query: UsersQuery = {},
): PaginatedResult<IUserWithMembershipResponse> {
	const search = query.search?.trim().toLowerCase() ?? '';
	const role =
		query.role !== undefined && query.role !== 'ALL' ? query.role : '';
	const tenantId = query.tenantId ?? '';
	const filtered = state.users.filter((user) => {
		if (tenantId && user.tenantId !== tenantId) return false;
		if (role && user.role !== role) return false;
		if (search) {
			const haystack =
				`${user.firstName} ${user.lastName} ${user.email}`.toLowerCase();
			if (!haystack.includes(search)) return false;
		}
		return true;
	});
	return paginate(filtered, query.page, query.limit ?? DEFAULT_PAGE_SIZE);
}

export function getTenantUsers(
	state: DemoState,
	tenantId: string,
): IUserWithMembershipResponse[] {
	return state.users.filter((user) => user.tenantId === tenantId);
}

export function getUserById(
	state: DemoState,
	userId: string,
): IUserWithMembershipResponse | undefined {
	return state.users.find((user) => user.id === userId);
}

export function getSession(state: DemoState): {
	user: IUserWithMembershipResponse | null;
	tenant: Tenant | null;
} {
	const user = state.session.userId
		? (getUserById(state, state.session.userId) ?? null)
		: null;
	const tenant = user?.tenantId
		? (getTenants(state).find((t) => t.id === user.tenantId) ?? null)
		: null;
	return { user, tenant };
}

export function getProfile(
	state: DemoState,
	userId: string,
): DemoCurrentUser | null {
	const user = getUserById(state, userId);
	if (!user) return null;
	const tenant = user.tenantId
		? getTenants(state).find((t) => t.id === user.tenantId)
		: undefined;
	return {
		id: user.id,
		email: user.email,
		firstName: user.firstName,
		lastName: user.lastName,
		role: user.role,
		tenantId: user.tenantId,
		mustChangePassword: user.mustChangePassword,
		tenantName: tenant?.name,
	};
}

// ---------------------------------------------------------------------------
// Academic data
// ---------------------------------------------------------------------------

export function getAcademicYears(state: DemoState): IAcademicYearResponse[] {
	return state.academicYears;
}

export function getCourses(
	state: DemoState,
	courseIds?: string[],
): ICourseResponse[] {
	if (!courseIds) return state.courses;
	return state.courses.filter((course) => courseIds.includes(course.id));
}

export function getMyCourses(
	state: DemoState,
	preceptorId: string,
): ICourseResponse[] {
	return state.courses.filter((course) => course.preceptorId === preceptorId);
}

export function getCourseById(
	state: DemoState,
	courseId: string,
): ICourseResponse | undefined {
	return state.courses.find((course) => course.id === courseId);
}

export function getCourseDetail(
	state: DemoState,
	courseId: string,
): ICourseDetailResponse | undefined {
	const course = getCourseById(state, courseId);
	if (!course) return undefined;
	return {
		...course,
		subjects: getSubjects(state, courseId),
		schedule: getSchedule(state, courseId),
	};
}

export function getSubjects(
	state: DemoState,
	courseId?: string,
): ISubjectResponse[] {
	return state.subjects.filter(
		(subject) => !courseId || subject.courseId === courseId,
	);
}

export function getSchedule(
	state: DemoState,
	courseId: string,
): IScheduleSlotResponse[] {
	const subjectIds = new Set(
		getSubjects(state, courseId).map((subject) => subject.id),
	);
	return state.schedules
		.filter((slot) => subjectIds.has(slot.subjectId))
		.sort(
			(a, b) =>
				a.dayOfWeek.localeCompare(b.dayOfWeek) ||
				a.startTime.localeCompare(b.startTime),
		);
}

export function getTeacherSubjects(
	state: DemoState,
	teacherId: string,
): ISubjectResponse[] {
	return state.subjects.filter((subject) => subject.teacherId === teacherId);
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export function getDailyAttendance(
	state: DemoState,
	courseId: string,
	date: string,
): DailyAttendance | undefined {
	const records = state.attendance.filter(
		(record) =>
			record.courseId === courseId && record.date === date && !record.subjectId,
	);
	const students = state.students.filter(
		(student) => student.courseId === courseId,
	);
	const counts = countByStatus(records);
	const studentsAtRisk = students
		.map((student) => ({
			studentId: student.id,
			studentName: student.fullName,
			absencePercent: getStudentAbsencePercent(state, student.id),
		}))
		.filter((entry) => entry.absencePercent >= DEMO_ABSENCE_WARNING_PERCENT)
		.sort((a, b) => b.absencePercent - a.absencePercent);
	return {
		date: new Date(`${date}T12:00:00.000Z`),
		courseId,
		records: records.map((record): AttendanceRecord => record),
		metrics: {
			totalStudents: students.length,
			...counts,
			absentPercent: absencePercent(counts.absent, counts.late, records.length),
			studentsAtRisk,
		},
	};
}

export function getSubjectAttendance(
	state: DemoState,
	subjectId: string,
	date: string,
): SubjectAttendanceResponse | null {
	const subject = state.subjects.find((item) => item.id === subjectId);
	if (!subject || !subject.courseId) return null;
	const courseId = subject.courseId;
	const records = state.attendance.filter(
		(record) => record.subjectId === subjectId && record.date === date,
	);
	return {
		subjectId,
		subjectName: subject.name,
		courseId,
		date,
		records: records.map((record): AttendanceRecord => record),
		metrics: {
			totalStudents: state.students.filter(
				(student) => student.courseId === courseId,
			).length,
			...countByStatus(records),
		},
	};
}

export function getSubjectHistory(
	state: DemoState,
	subjectId: string,
): SubjectHistoryResponse | null {
	const subject = state.subjects.find((item) => item.id === subjectId);
	if (!subject || !subject.courseId) return null;
	const courseId = subject.courseId;
	const records = state.attendance.filter(
		(record) => record.subjectId === subjectId,
	);
	const classDates = distinctDates(records.map((record) => record.date));
	const sessions = classDates.map((date) => {
		const dayRecords = records.filter((record) => record.date === date);
		return {
			date,
			totalStudents: dayRecords.length,
			...countByStatus(dayRecords),
		};
	});
	const studentRecords = state.students
		.filter((student) => student.courseId === courseId)
		.map((student) => {
			const studentDayRecords = records.filter(
				(record) => record.studentId === student.id,
			);
			const counts = countByStatus(studentDayRecords);
			return {
				studentId: student.id,
				studentName: student.fullName,
				records: studentDayRecords.map((record) => ({
					date: record.date,
					status: record.status,
				})),
				absencePercent: absencePercent(
					counts.absent,
					counts.late,
					classDates.length,
				),
			};
		});
	return {
		subjectId,
		subjectName: subject.name,
		from: classDates[0] ?? '',
		to: classDates.at(-1) ?? '',
		classDates,
		sessions,
		studentRecords,
	};
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export function getAlerts(
	state: DemoState,
	query: AlertsQuery = {},
): AlertsListResponse {
	const all = [...state.alerts].sort(
		(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
	);
	const filtered =
		query.unseenOnly === true
			? all.filter((alert) => alert.seenAt === null)
			: all;
	return {
		...paginate(filtered, query.page, query.limit ?? DEFAULT_PAGE_SIZE),
		limit: query.limit ?? DEFAULT_PAGE_SIZE,
	};
}

export function getUnseenAlertsCount(state: DemoState): AlertsCount {
	return { count: state.alerts.filter((alert) => alert.seenAt === null).length };
}

export function getStudentAlerts(state: DemoState, studentId: string): Alert[] {
	return state.alerts
		.filter((alert) => alert.studentId === studentId)
		.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

export function getAnnouncements(
	state: DemoState,
	query: AnnouncementsQuery = {},
): AnnouncementsListResponse {
	const all = [...state.announcements].sort((a, b) =>
		b.createdAt.localeCompare(a.createdAt),
	);
	const filtered = query.status
		? all.filter((item) => item.status === query.status)
		: all;
	return {
		...paginate(filtered, query.page, query.limit ?? DEFAULT_PAGE_SIZE),
		limit: query.limit ?? DEFAULT_PAGE_SIZE,
	};
}

export function getAnnouncementById(
	state: DemoState,
	announcementId: string,
): Announcement | undefined {
	return state.announcements.find((item) => item.id === announcementId);
}

export function getReadAnnouncementIds(
	state: DemoState,
	userId: string,
): Set<string> {
	return new Set(state.announcementReads[userId] ?? []);
}

/** courseId -> course fullName (for target labels in the UI). */
export function getAnnouncementCourseNames(
	state: DemoState,
): Record<string, string> {
	const names: Record<string, string> = {};
	for (const course of state.courses) names[course.id] = course.fullName;
	return names;
}

/**
 * Announcements relevant to a user, replicating the product's for-me logic
 * (school always, course by targetId, level by level; PRECEPTOR additionally
 * resolves courses + levels, TEACHER resolves subject courses). Deterministic
 * order: published first, then createdAt desc.
 */
export function getAnnouncementsForMe(
	state: DemoState,
	userId: string,
): Announcement[] {
	const user = getUserById(state, userId);
	const params = resolveAnnouncementContexts(state, user ?? null);
	const relevant: Announcement[] = [];
	for (const announcement of state.announcements) {
		if (announcement.status !== 'published') continue;
		if (
			params.some(
				(ctx) =>
					announcement.targetType === 'school' ||
					(announcement.targetType === 'course' &&
						ctx.courseId === announcement.targetId) ||
					(announcement.targetType === 'level' &&
						ctx.level === announcement.targetId.toLowerCase()),
			)
		) {
			relevant.push(announcement);
		}
	}
	return dedupeById(relevant).sort((a, b) =>
		b.createdAt.localeCompare(a.createdAt),
	);
}

function resolveAnnouncementContexts(
	state: DemoState,
	user: IUserWithMembershipResponse | null,
): Array<{ courseId?: string; level?: string }> {
	const contexts: Array<{ courseId?: string; level?: string }> = [{}];
	if (!user) return contexts;
	if (user.role === ROLES.PRECEPTOR) {
		const courses = state.courses.filter(
			(course) => course.preceptorId === user.id,
		);
		const ids = [...new Set(courses.map((course) => course.id))];
		const levels = [
			...new Set(
				courses.map((course) => course.level).map((level) => level.toLowerCase()),
			),
		];
		for (const courseId of ids) contexts.push({ courseId });
		for (const level of levels) contexts.push({ level });
	} else if (user.role === ROLES.TEACHER) {
		const subjectCourseIds = state.subjects
			.filter(
				(subject) => subject.teacherId === user.id && Boolean(subject.courseId),
			)
			.map((subject) => subject.courseId as string);
		for (const courseId of new Set(subjectCourseIds)) contexts.push({ courseId });
	}
	return contexts;
}

/** Unique by id, keeping the first occurrence in the given order. */
export function dedupeById<T extends { id: string }>(items: T[]): T[] {
	const seen = new Set<string>();
	const out: T[] = [];
	for (const item of items) {
		if (seen.has(item.id)) continue;
		seen.add(item.id);
		out.push(item);
	}
	return out;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function getCourseAttendance(
	state: DemoState,
	courseId: string,
): {
	expected: number;
	present: number;
	absent: number;
	late: number;
	justified: number;
	notRecorded: number;
} {
	const records = state.attendance.filter(
		(record) => record.courseId === courseId,
	);
	const dates = distinctDates(records.map((record) => record.date));
	const students = state.students.filter(
		(student) => student.courseId === courseId,
	);
	const expected = dates.length * students.length;
	const counts = countByStatus(records);
	const recorded =
		counts.present + counts.absent + counts.late + counts.justified;
	return { expected, ...counts, notRecorded: Math.max(0, expected - recorded) };
}

export function getCourseSnapshot(
	state: DemoState,
	courseId: string,
): CourseSnapshot | null {
	const course = getCourseById(state, courseId);
	if (!course) return null;
	const { expected, present, absent, late, justified, notRecorded } =
		getCourseAttendance(state, courseId);
	const absencePercentValue = absencePercent(absent, late, expected);
	return {
		courseId: course.id,
		courseName: course.fullName,
		level: course.level,
		totalStudents: getCourseStudentsDetailed(state, courseId).length,
		present,
		absent,
		late,
		justified,
		notRecorded,
		absencePercent: absencePercentValue,
		attendancePercent: Number((100 - absencePercentValue).toFixed(1)),
		statusColor: courseRiskStatus(absencePercentValue),
		lastUpdated: demoTodayDate(),
	};
}

export function getCourseSnapshots(
	state: DemoState,
	courseIds?: string[],
): CourseSnapshot[] {
	const ids = courseIds ?? state.courses.map((course) => course.id);
	return ids
		.map((id) => getCourseSnapshot(state, id))
		.filter((snapshot): snapshot is CourseSnapshot => snapshot !== null);
}

export function getCourseSnapshotDetail(
	state: DemoState,
	courseId: string,
): CourseSnapshotDetail | null {
	const snapshot = getCourseSnapshot(state, courseId);
	if (!snapshot) return null;
	return {
		...snapshot,
		records: state.attendance
			.filter((record) => record.courseId === courseId)
			.map((record): AttendanceRecord => record),
	};
}

export function getDashboardMetrics(
	state: DemoState,
	courseIds?: string[],
): DashboardMetrics {
	const snapshots = getCourseSnapshots(state, courseIds);
	const averageAttendance = snapshots.length
		? Number(
				(
					snapshots.reduce((sum, snap) => sum + snap.attendancePercent, 0) /
					snapshots.length
				).toFixed(1),
			)
		: 0;
	return {
		averageAttendance,
		coursesAtRisk: snapshots.filter(
			(snap) => snap.statusColor !== COURSE_RISK_STATUS.OK,
		),
		weeklyTrend: weeklyTrendFromRecords(
			courseIds
				? state.attendance.filter((record) => courseIds.includes(record.courseId))
				: state.attendance,
		),
	};
}

export function getPreceptorDashboard(
	state: DemoState,
	preceptorId: string,
): PreceptorDashboard {
	const courses = getMyCourses(state, preceptorId);
	return {
		date: demoTodayDate(),
		courses: getCourseSnapshots(
			state,
			courses.map((course) => course.id),
		),
	};
}

/** Weekly attendance trend over the whole dataset, ascending by week. */
export function weeklyTrendFromRecords(
	records: DemoAttendanceRecord[],
): WeeklyTrendPoint[] {
	const byWeek = new Map<
		string,
		{ monday: Date; counts: ReturnType<typeof countByStatus> }
	>();
	for (const record of records) {
		const monday = mondayOfWeek(record.date);
		const key = monday.toISOString().slice(0, 10);
		let bucket = byWeek.get(key);
		if (!bucket) {
			bucket = {
				monday,
				counts: { present: 0, absent: 0, late: 0, justified: 0 },
			};
			byWeek.set(key, bucket);
		}
		bucket.counts[record.status] += 1;
	}
	return [...byWeek.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([, bucket]) => {
			const total =
				bucket.counts.present +
				bucket.counts.absent +
				bucket.counts.late +
				bucket.counts.justified;
			const effective = effectiveAbsenceCount(
				bucket.counts.absent,
				bucket.counts.late,
			);
			return {
				mondayWeek: bucket.monday,
				percent:
					total > 0 ? Number(((1 - effective / total) * 100).toFixed(1)) : 100,
			};
		});
}

export function getSuperAdminAnalytics(state: DemoState): SuperAdminAnalytics {
	const tenants = state.tenants;
	const activeTenants = tenants.filter((tenant) => tenant.isActive);
	return {
		totals: {
			totalTenants: tenants.length,
			activeTenants: activeTenants.length,
			inactiveTenants: tenants.length - activeTenants.length,
			totalUsers: state.users.length,
		},
		perTenant: tenants.map((tenant) => ({
			id: tenant.id,
			name: tenant.name,
			subdomain: tenant.subdomain,
			isActive: tenant.isActive,
			userCount: state.users.filter((user) => user.tenantId === tenant.id).length,
		})),
		tenantsTrend: [...tenants]
			.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
			.map((tenant) => ({
				month: `${tenant.createdAt.getFullYear()}-${String(tenant.createdAt.getMonth() + 1).padStart(2, '0')}`,
				count: 1,
			})),
	};
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export function getAvailableReportPeriods(
	state: DemoState,
	courseId: string,
): AvailableReportPeriod[] {
	const records = state.attendance.filter(
		(record) => record.courseId === courseId,
	);
	const months = new Map<string, AvailableReportPeriod>();
	for (const record of records) {
		const date = new Date(`${record.date}T00:00:00.000Z`);
		const key = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`;
		if (!months.has(key)) {
			months.set(key, {
				month: date.getUTCMonth() + 1,
				year: date.getUTCFullYear(),
			});
		}
	}
	return [...months.values()].sort(
		(a, b) => a.year - b.year || a.month - b.month,
	);
}

export function getMonthlyReport(
	state: DemoState,
	courseId: string,
	month: number,
	year: number,
): MonthlyReport | null {
	const course = getCourseById(state, courseId);
	if (!course) return null;
	const monthStr = String(month).padStart(2, '0');
	const records = state.attendance.filter(
		(record) =>
			record.courseId === courseId &&
			record.date.startsWith(`${year}-${monthStr}`),
	);
	const workingDays = distinctDates(records.map((record) => record.date)).length;
	const students = state.students.filter(
		(student) => student.courseId === courseId,
	);
	const reportStudents: MonthlyReportStudent[] = students.map((student) => {
		const studentRecords = records.filter(
			(record) => record.studentId === student.id,
		);
		const counts = countByStatus(studentRecords);
		const pct = absencePercent(counts.absent, counts.late, studentRecords.length);
		const alerts = getStudentAlerts(state, student.id).map((alert) => ({
			status: alert.alertType,
		}));
		return {
			studentId: student.id,
			fullName: student.fullName,
			documentNumber: student.documentNumber,
			present: counts.present,
			absent: counts.absent,
			late: counts.late,
			justified: counts.justified,
			absencePercent: pct,
			status: absenceToReportStatus(pct),
			alerts,
		};
	});
	const summary = {
		averageAttendance: reportStudents.length
			? Number(
					(
						reportStudents.reduce(
							(sum, student) => sum + (100 - student.absencePercent),
							0,
						) / reportStudents.length
					).toFixed(1),
				)
			: 0,
		studentsAtRisk: reportStudents.filter(
			(student) => student.status === 'at-risk',
		).length,
		studentsExceeded: reportStudents.filter(
			(student) => student.status === 'exceeded',
		).length,
	};
	return {
		id: `${courseId}-${year}-${month}`,
		courseId,
		courseName: course.fullName,
		level: course.level,
		period: { month, year },
		workingDays,
		students: reportStudents,
		summary,
		generatedAt: demoTodayDate(),
	};
}

export function getCourseSummary(
	state: DemoState,
	courseId: string,
): CourseSummaryEntry[] {
	const periods = getAvailableReportPeriods(state, courseId);
	return periods
		.map((period) => {
			const report = getMonthlyReport(state, courseId, period.month, period.year);
			return {
				month: period.month,
				year: period.year,
				averageAttendance: report?.summary.averageAttendance ?? 0,
			};
		})
		.filter((entry) => entry.averageAttendance > 0);
}

export function getStudentReport(
	state: DemoState,
	studentId: string,
): StudentReport | null {
	const student = getStudentById(state, studentId);
	if (!student || !student.courseId) return null;
	const course = getCourseById(state, student.courseId);
	const records = getStudentRecords(state, studentId);
	const monthKeys = new Set<string>();
	for (const record of records) {
		monthKeys.add(record.date.slice(0, 7));
	}
	const months = [...monthKeys].sort().map((key) => {
		const [year = 0, month = 0] = key.split('-').map(Number);
		const monthRecords = records.filter((record) => record.date.startsWith(key));
		const counts = countByStatus(monthRecords);
		const pct = absencePercent(counts.absent, counts.late, monthRecords.length);
		return {
			month,
			year,
			...counts,
			absencePercent: pct,
			status: absenceToReportStatus(pct),
		};
	});
	const totals = getStudentAttendanceTotals(state, studentId);
	return {
		studentId,
		fullName: student.fullName,
		documentNumber: student.documentNumber,
		courseId: student.courseId,
		courseName: course?.fullName ?? '',
		level: course?.level ?? LEVEL.DEFAULT,
		academicYearId: course?.academicYearId ?? '',
		months,
		totals: {
			...totals,
			totalDays: distinctDates(records.map((record) => record.date)).length,
			averageAbsencePercent: getStudentAbsencePercent(state, studentId, totals),
		},
		status: absenceToReportStatus(
			getStudentAbsencePercent(state, studentId, totals),
		),
		alerts: getStudentAlerts(state, studentId).map((alert) => ({
			status: alert.alertType,
		})),
	};
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export function getLandingProfiles(state: DemoState) {
	return state.users.map((user) => {
		const tenant = user.tenantId
			? getTenants(state).find((t) => t.id === user.tenantId)
			: undefined;
		return {
			user: {
				id: user.id,
				firstName: user.firstName,
				lastName: user.lastName,
				role: user.role,
				email: user.email,
			},
			tenantName: tenant?.name ?? null,
		};
	});
}
