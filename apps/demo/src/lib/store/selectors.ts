/**
 * Demo store — derived selectors.
 *
 * All selectors are pure functions of the demo state (plus explicit params),
 * mirroring the response contracts of @repo/common that the real feature
 * components consume. Math helpers are exported at the top so both the seed
 * generator (alerts consistency) and the tests share a single source of truth.
 */

import {
	type CourseSummary,
	type MyWorkshopCommission,
	type WorkshopAttendance,
	getStandardNationalHolidays,
	isWorkshopOnlyCourse,
} from '@repo/common';
import { resolveSubjectAudience, weekdayOfIsoDate } from './subject-audience';
import {
	ATTENDANCE_THRESHOLDS,
	type Alert,
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
	type IWorkshopCommissionResponse,
	LEVEL,
	type MonthlyReport,
	type MonthlyReportStudent,
	type PreceptorDashboard,
	ROLES,
	type Roles,
	STUDENTSTATUS,
	type StudentReport,
	type SubjectAttendanceResponse,
	type SubjectHistoryResponse,
	type SuperAdminAnalytics,
	type Tenant,
	type WeeklyTrendPoint,
} from './types';
import {
	type AlertsQuery,
	type AnnouncementsQuery,
	DEMO_ATTENDANCE_DAYS,
	DEMO_TODAY,
	type DemoAttendanceRecord,
	type DemoCurrentUser,
	type DemoState,
	type DemoStudent,
	type PaginatedResult,
	type StudentAttendanceTotals,
	type StudentsQuery,
	type UsersQuery,
	demoTodayDate,
} from './types';
import {
	LATE_BEYOND_TOLERANCE_WEIGHT,
	LATE_WEIGHT,
	absenceCountToReportStatus,
	absencePercentOver,
	calculateWeightedAbsences,
	countDaysGiven,
} from './weighted-absence';

// ---------------------------------------------------------------------------
// Math helpers (single source of truth: seeds + alerts + tests)
// ---------------------------------------------------------------------------

function countByStatus(records: readonly { status: string }[]): {
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
				case 'late_beyond_tolerance':
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

/** Risk color like the product course snapshot (75/85 thresholds). */
export function courseRiskStatus(pct: number): COURSE_RISK_STATUS {
	if (pct >= ATTENDANCE_THRESHOLDS.CRITICAL) return COURSE_RISK_STATUS.CRITICAL;
	if (pct >= ATTENDANCE_THRESHOLDS.WARNING) return COURSE_RISK_STATUS.WARNING;
	return COURSE_RISK_STATUS.OK;
}

/** National holidays of the demo year plus the declared institutional day. */
export const DEMO_HOLIDAYS: readonly string[] =
	getStandardNationalHolidays(2026);

/** Institutional non-working day declared in the seed (with its announcement). */
export const DEMO_INSTITUTIONAL_DAY = '2026-06-12';

/** Last `count` business days ending at `endISODate`, ascending. */
export function generateLastBusinessDays(
	endISODate: string = DEMO_TODAY,
	count: number = DEMO_ATTENDANCE_DAYS,
	holidays: ReadonlySet<string> = new Set([
		...DEMO_HOLIDAYS,
		DEMO_INSTITUTIONAL_DAY,
	]),
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

/** Weighted contribution of a record to a subject's absence count. */
function subjectWeight(status: string): number {
	switch (status) {
		case 'absent':
		case 'justified':
			return 1;
		case 'late':
			return LATE_WEIGHT;
		case 'late_beyond_tolerance':
			return LATE_BEYOND_TOLERANCE_WEIGHT;
		default:
			return 0;
	}
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

export interface DateRange {
	from?: string;
	to?: string;
}

function inRange(date: string, range: DateRange): boolean {
	const day = date.slice(0, 10);
	if (range.from && day < range.from) return false;
	if (range.to && day > range.to) return false;
	return true;
}

/** Weighted totals from already-filtered daily and workshop records. */
export function totalsFromRecords(
	daily: readonly { status: string; date: string }[],
	workshop: readonly { status: string; date: string }[],
	workshopOnly: boolean,
): StudentAttendanceTotals {
	const { total, breakdown } = calculateWeightedAbsences({
		dailyRecords: daily,
		workshopRecords: workshop,
		workshopOnly,
	});
	// A workshop-only course has no daily shift: its counts come from workshop.
	const counts = countByStatus(workshopOnly ? workshop : daily);
	return {
		present: counts.present,
		absent: total,
		late: counts.late,
		justified: counts.justified,
		daysGiven: countDaysGiven(daily, workshop),
		absenceBreakdown: breakdown,
	};
}

/** Whether the course of a student is workshop-only (7th year technical). */
export function isStudentWorkshopOnly(
	state: DemoState,
	student: { courseId?: string } | undefined,
): boolean {
	const course = student?.courseId
		? getCourseById(state, student.courseId)
		: undefined;
	return course ? isWorkshopOnlyCourse(course) : false;
}

/**
 * Institutional totals of a student: weighted absences (daily + workshop),
 * counts of the shift that counts, and the days effectively given.
 */
export function getStudentAttendanceTotals(
	state: DemoState,
	studentId: string,
	range: DateRange = {},
): StudentAttendanceTotals {
	const student = state.students.find((item) => item.id === studentId);
	const daily = state.attendance.filter(
		(record) =>
			record.studentId === studentId &&
			!record.subjectId &&
			inRange(record.date, range),
	);
	const workshop = state.workshopAttendance.filter(
		(record) => record.studentId === studentId && inRange(record.date, range),
	);
	return totalsFromRecords(
		daily,
		workshop,
		isStudentWorkshopOnly(state, student),
	);
}

/** Absence statistic over the days given; null when no class was given. */
export function getStudentAbsencePercent(
	state: DemoState,
	studentId: string,
	totals?: StudentAttendanceTotals,
): number | null {
	const calculated = totals ?? getStudentAttendanceTotals(state, studentId);
	return absencePercentOver(calculated.absent, calculated.daysGiven);
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
// Workshop commissions
// ---------------------------------------------------------------------------

function compareNames(
	a: { lastName: string; firstName: string },
	b: { lastName: string; firstName: string },
): number {
	const compare = (x: string, y: string) =>
		x.localeCompare(y, 'es', { sensitivity: 'base' });
	return compare(a.lastName, b.lastName) || compare(a.firstName, b.firstName);
}

/** Commission code: year + division + number (course 7 "A", commission 1 -> "7A1"). */
export function commissionCode(
	course: Pick<ICourseResponse, 'yearNumber' | 'division'>,
	number: number,
): string {
	return `${course.yearNumber}${course.division}${number}`;
}

/** Active students of a commission, alphabetical. */
export function getCommissionStudents(
	state: DemoState,
	commissionId: string,
): DemoStudent[] {
	return state.students
		.filter(
			(student) =>
				student.workshopCommissionId === commissionId &&
				student.status === STUDENTSTATUS.ACTIVE,
		)
		.sort(compareNames);
}

export function getWorkshopCommissions(
	state: DemoState,
	courseId: string,
): IWorkshopCommissionResponse[] {
	const course = getCourseById(state, courseId);
	if (!course) return [];
	return state.workshopCommissions
		.filter((commission) => commission.courseId === courseId)
		.sort((a, b) => a.number - b.number)
		.map((commission) => {
			const students = getCommissionStudents(state, commission.id);
			return {
				id: commission.id,
				courseId,
				number: commission.number,
				code: commissionCode(course, commission.number),
				preceptorId: commission.preceptorId,
				studentCount: students.length,
				students: students.map((student) => ({
					id: student.id,
					lastName: student.lastName,
					firstName: student.firstName,
				})),
			};
		});
}

/** Weekdays on which a commission has a workshop slot. */
function commissionWorkshopDays(
	state: DemoState,
	courseId: string,
	number: number,
): Set<string> {
	const workshopSubjectIds = new Set(
		state.subjects
			.filter(
				(subject) => subject.courseId === courseId && subject.kind === 'workshop',
			)
			.map((subject) => subject.id),
	);
	return new Set(
		state.schedules
			.filter(
				(slot) =>
					workshopSubjectIds.has(slot.subjectId) &&
					(slot.commissionNumber == null || slot.commissionNumber === number),
			)
			.map((slot) => slot.dayOfWeek),
	);
}

/**
 * Commissions the user can take workshop attendance for: every commission for
 * admins, the ones assigned to them for preceptors. Flags whether the
 * commission has a workshop on the weekday of `date`.
 */
export function getMyWorkshopCommissions(
	state: DemoState,
	user: { id: string; role: Roles } | null | undefined,
	date: string,
): MyWorkshopCommission[] {
	if (!user) return [];
	const isAdmin = user.role === ROLES.ADMIN || user.role === ROLES.SUPERADMIN;
	const weekday = weekdayOfIsoDate(date);
	return state.workshopCommissions
		.filter((commission) => isAdmin || commission.preceptorId === user.id)
		.flatMap((commission) => {
			const course = getCourseById(state, commission.courseId);
			if (!course) return [];
			return [
				{
					commissionId: commission.id,
					code: commissionCode(course, commission.number),
					number: commission.number,
					courseId: course.id,
					courseName: course.fullName,
					hasWorkshopToday:
						weekday !== undefined &&
						commissionWorkshopDays(state, course.id, commission.number).has(weekday),
				},
			];
		})
		.sort((a, b) => a.code.localeCompare(b.code));
}

/** Active students of the commission with their workshop status for a date. */
export function getWorkshopAttendance(
	state: DemoState,
	commissionId: string,
	date: string,
): WorkshopAttendance | null {
	const commission = state.workshopCommissions.find(
		(item) => item.id === commissionId,
	);
	const course = commission ? getCourseById(state, commission.courseId) : null;
	if (!commission || !course) return null;
	const records = new Map(
		state.workshopAttendance
			.filter(
				(record) => record.commissionId === commissionId && record.date === date,
			)
			.map((record) => [record.studentId, record]),
	);
	return {
		commissionId,
		commissionCode: commissionCode(course, commission.number),
		courseId: course.id,
		courseName: course.fullName,
		date,
		records: getCommissionStudents(state, commissionId).map((student) => ({
			id: records.get(student.id)?.id ?? null,
			studentId: student.id,
			studentName: student.fullName,
			status: records.get(student.id)?.status ?? null,
			editedBy: null,
			editedAt: null,
		})),
	};
}

/**
 * Active roster of a subject on a date: the whole course, or only the workshop
 * commission(s) its slots target on that weekday.
 */
export function getSubjectRoster(
	state: DemoState,
	subjectId: string,
	date?: string,
): DemoStudent[] {
	const subject = state.subjects.find((item) => item.id === subjectId);
	if (!subject?.courseId) return [];
	const courseId = subject.courseId;
	const active = state.students.filter(
		(student) =>
			student.courseId === courseId && student.status === STUDENTSTATUS.ACTIVE,
	);
	const slots = state.schedules.filter((slot) => slot.subjectId === subjectId);
	const audience = resolveSubjectAudience(
		slots,
		date ? weekdayOfIsoDate(date) : undefined,
	);
	if (audience === 'whole-course') return active;
	const commissions = state.workshopCommissions.filter(
		(commission) => commission.courseId === courseId,
	);
	const ids: string[] = [];
	for (const number of audience) {
		const commission = commissions.find((item) => item.number === number);
		// A slot targeting a commission that does not exist falls back to the course.
		if (!commission) return active;
		ids.push(commission.id);
	}
	return active.filter(
		(student) =>
			student.workshopCommissionId !== undefined &&
			ids.includes(student.workshopCommissionId),
	);
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export function getDailyAttendance(
	state: DemoState,
	courseId: string,
	date: string,
): DailyAttendance | undefined {
	const course = getCourseById(state, courseId);
	// Workshop-only courses (7th year technical) have no daily attendance.
	const records =
		course && isWorkshopOnlyCourse(course)
			? []
			: state.attendance.filter(
					(record) =>
						record.courseId === courseId && record.date === date && !record.subjectId,
				);
	const students = state.students.filter(
		(student) => student.courseId === courseId,
	);
	const counts = countByStatus(records);
	const studentsAtRisk = students
		.map((student) => {
			const totals = getStudentAttendanceTotals(state, student.id);
			return {
				studentId: student.id,
				studentName: student.fullName,
				absenceCount: totals.absent,
				absencePercent: getStudentAbsencePercent(state, student.id, totals) ?? 0,
			};
		})
		.filter((entry) => absenceCountToReportStatus(entry.absenceCount) !== 'ok')
		.sort((a, b) => b.absenceCount - a.absenceCount)
		.map(({ studentId, studentName, absencePercent }) => ({
			studentId,
			studentName,
			absencePercent,
		}));
	return {
		date: new Date(`${date}T12:00:00.000Z`),
		courseId,
		records: records.map((record): AttendanceRecord => record),
		metrics: {
			totalStudents: students.length,
			...counts,
			absentPercent: records.length
				? Number(((counts.absent / records.length) * 100).toFixed(1))
				: 0,
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
	const roster = new Set(
		getSubjectRoster(state, subjectId, date).map((student) => student.id),
	);
	const records = state.attendance.filter(
		(record) =>
			record.subjectId === subjectId &&
			record.date === date &&
			roster.has(record.studentId),
	);
	return {
		subjectId,
		subjectName: subject.name,
		courseId,
		date,
		records: records.map((record): AttendanceRecord => record),
		metrics: {
			totalStudents: roster.size,
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
	const roster = getSubjectRoster(state, subjectId);
	const studentRecords = roster.map((student) => {
		const studentDayRecords = records.filter(
			(record) => record.studentId === student.id,
		);
		const weighted = studentDayRecords.reduce(
			(sum, record) => sum + subjectWeight(record.status),
			0,
		);
		return {
			studentId: student.id,
			studentName: student.fullName,
			records: studentDayRecords.map((record) => ({
				date: record.date,
				status: record.status,
			})),
			absencePercent: classDates.length
				? Number(((weighted / classDates.length) * 100).toFixed(1))
				: 0,
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

/**
 * Daily and subject attendance of a student in a date range (the history
 * page's source, like the product's /attendance/student endpoint).
 */
export function getStudentAttendanceHistory(
	state: DemoState,
	studentId: string,
	range: DateRange = {},
): AttendanceRecord[] {
	return state.attendance
		.filter(
			(record) => record.studentId === studentId && inRange(record.date, range),
		)
		.sort((a, b) => a.date.localeCompare(b.date))
		.map((record): AttendanceRecord => record);
}

/** Whether a date is declared non-working for an academic year. */
export function isNonWorkingDay(
	state: DemoState,
	academicYearId: string | undefined,
	isoDate: string,
): boolean {
	const year = state.academicYears.find((item) => item.id === academicYearId);
	return (year?.nonWorkingDays ?? []).some(
		(day) => new Date(day).toISOString().slice(0, 10) === isoDate,
	);
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

/**
 * Raw record counts of a course for the shift that counts (daily, or workshop
 * for a workshop-only course) plus the weighted absence total of its students.
 */
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
	const course = getCourseById(state, courseId);
	const workshopOnly = course ? isWorkshopOnlyCourse(course) : false;
	const workshopRecords = workshopOnly
		? state.workshopAttendance.filter((record) => record.courseId === courseId)
		: [];
	const records: { status: string; date: string }[] = workshopOnly
		? workshopRecords
		: state.attendance.filter(
				(record) => record.courseId === courseId && !record.subjectId,
			);
	const students = state.students.filter(
		(student) => student.courseId === courseId,
	);
	// Daily: every student is expected on each day with records. Workshop-only:
	// each commission is expected on its own workshop days.
	const expected = workshopOnly
		? state.workshopCommissions
				.filter((commission) => commission.courseId === courseId)
				.reduce((sum, commission) => {
					const days = distinctDates(
						workshopRecords
							.filter((record) => record.commissionId === commission.id)
							.map((record) => record.date),
					).length;
					return sum + days * getCommissionStudents(state, commission.id).length;
				}, 0)
		: distinctDates(records.map((record) => record.date)).length *
			students.length;
	const counts = countByStatus(records);
	const weightedAbsent = students.reduce(
		(sum, student) => sum + getStudentAttendanceTotals(state, student.id).absent,
		0,
	);
	return {
		expected,
		present: counts.present,
		absent: weightedAbsent,
		late: counts.late,
		justified: counts.justified,
		notRecorded: Math.max(0, expected - records.length),
	};
}

export function getCourseSnapshot(
	state: DemoState,
	courseId: string,
): CourseSnapshot | null {
	const course = getCourseById(state, courseId);
	if (!course) return null;
	const { expected, present, absent, late, justified, notRecorded } =
		getCourseAttendance(state, courseId);
	const absencePercentValue = expected
		? Number(((absent / expected) * 100).toFixed(1))
		: 0;
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
		workshopOnly: isWorkshopOnlyCourse(course),
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
			.filter((record) => record.courseId === courseId && !record.subjectId)
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
			(courseIds
				? state.attendance.filter((record) => courseIds.includes(record.courseId))
				: state.attendance
			).filter((record) => !record.subjectId),
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

/** Weekly attendance trend over daily records, ascending by week. */
export function weeklyTrendFromRecords(
	records: DemoAttendanceRecord[],
): WeeklyTrendPoint[] {
	const byWeek = new Map<
		string,
		{ monday: Date; weighted: number; total: number }
	>();
	for (const record of records) {
		const monday = mondayOfWeek(record.date);
		const key = monday.toISOString().slice(0, 10);
		let bucket = byWeek.get(key);
		if (!bucket) {
			bucket = { monday, weighted: 0, total: 0 };
			byWeek.set(key, bucket);
		}
		bucket.weighted += subjectWeight(record.status);
		bucket.total += 1;
	}
	return [...byWeek.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([, bucket]) => ({
			mondayWeek: bucket.monday,
			percent:
				bucket.total > 0
					? Number(((1 - bucket.weighted / bucket.total) * 100).toFixed(1))
					: 100,
		}));
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

/** Course-wide records (daily, subject and workshop) used to list periods. */
function courseRecordDates(state: DemoState, courseId: string): string[] {
	return [
		...state.attendance
			.filter((record) => record.courseId === courseId)
			.map((record) => record.date),
		...state.workshopAttendance
			.filter((record) => record.courseId === courseId)
			.map((record) => record.date),
	];
}

export function getAvailableReportPeriods(
	state: DemoState,
	courseId: string,
): AvailableReportPeriod[] {
	const months = new Map<string, AvailableReportPeriod>();
	for (const day of courseRecordDates(state, courseId)) {
		const date = new Date(`${day}T00:00:00.000Z`);
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

function monthRange(month: number, year: number): { from: string; to: string } {
	const monthStr = String(month).padStart(2, '0');
	return { from: `${year}-${monthStr}-01`, to: `${year}-${monthStr}-31` };
}

export function getMonthlyReport(
	state: DemoState,
	courseId: string,
	month: number,
	year: number,
): MonthlyReport | null {
	const course = getCourseById(state, courseId);
	if (!course) return null;
	const range = monthRange(month, year);
	const students = state.students.filter(
		(student) => student.courseId === courseId,
	);
	const workingDays = distinctDates(
		courseRecordDates(state, courseId).filter((day) => inRange(day, range)),
	).length;
	const reportStudents: MonthlyReportStudent[] = students.map((student) => {
		const totals = getStudentAttendanceTotals(state, student.id, range);
		// Status follows the cumulative institutional count up to the month end.
		const cumulative = getStudentAttendanceTotals(state, student.id, {
			to: range.to,
		});
		return {
			studentId: student.id,
			fullName: student.fullName,
			documentNumber: student.documentNumber,
			present: totals.present,
			absent: totals.absent,
			late: totals.late,
			justified: totals.justified,
			daysGiven: totals.daysGiven,
			absenceBreakdown: totals.absenceBreakdown,
			absencePercent: absencePercentOver(totals.absent, totals.daysGiven),
			status: absenceCountToReportStatus(cumulative.absent),
			alerts: getStudentAlerts(state, student.id).map((alert) => ({
				status: alert.alertType,
			})),
		};
	});
	const withClasses = reportStudents.filter(
		(student) => typeof student.absencePercent === 'number',
	);
	const summary = {
		averageAttendance: withClasses.length
			? Number(
					(
						withClasses.reduce(
							(sum, student) => sum + (100 - (student.absencePercent ?? 0)),
							0,
						) / withClasses.length
					).toFixed(1),
				)
			: null,
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
	return getAvailableReportPeriods(state, courseId)
		.map((period) => {
			const report = getMonthlyReport(state, courseId, period.month, period.year);
			return {
				month: period.month,
				year: period.year,
				averageAttendance: report?.summary.averageAttendance ?? null,
			};
		})
		.filter((entry) => entry.averageAttendance !== null);
}

/** Course summary in the shape of the product's `/reports/course/:id/summary`. */
export function getCourseSummaryResponse(
	state: DemoState,
	courseId: string,
): CourseSummary | null {
	const course = getCourseById(state, courseId);
	if (!course) return null;
	return {
		courseId,
		academicYearId: course.academicYearId ?? '',
		months: getCourseSummary(state, courseId),
	};
}

export function getStudentReport(
	state: DemoState,
	studentId: string,
): StudentReport | null {
	const student = getStudentById(state, studentId);
	if (!student || !student.courseId) return null;
	const course = getCourseById(state, student.courseId);
	const monthKeys = new Set<string>();
	for (const record of state.attendance) {
		if (record.studentId === studentId) monthKeys.add(record.date.slice(0, 7));
	}
	for (const record of state.workshopAttendance) {
		if (record.studentId === studentId) monthKeys.add(record.date.slice(0, 7));
	}
	const months = [...monthKeys].sort().map((key) => {
		const [year = 0, month = 0] = key.split('-').map(Number);
		const range = monthRange(month, year);
		const totals = getStudentAttendanceTotals(state, studentId, range);
		const cumulative = getStudentAttendanceTotals(state, studentId, {
			to: range.to,
		});
		return {
			month,
			year,
			present: totals.present,
			absent: totals.absent,
			late: totals.late,
			justified: totals.justified,
			daysGiven: totals.daysGiven,
			absenceBreakdown: totals.absenceBreakdown,
			absencePercent: absencePercentOver(totals.absent, totals.daysGiven),
			status: absenceCountToReportStatus(cumulative.absent),
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
			present: totals.present,
			absent: totals.absent,
			late: totals.late,
			justified: totals.justified,
			totalDays: totals.daysGiven,
			absenceBreakdown: totals.absenceBreakdown,
			averageAbsencePercent: getStudentAbsencePercent(state, studentId, totals),
		},
		status: absenceCountToReportStatus(totals.absent),
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
