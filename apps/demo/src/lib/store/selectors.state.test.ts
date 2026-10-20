import { describe, expect, it } from 'vitest';
import { createSeedState } from './seed-data';
import { demoIds } from './seed-data';
import {
	getAlerts,
	getAnnouncements,
	getAnnouncementsForMe,
	getCourseSnapshots,
	getCourseSummary,
	getDailyAttendance,
	getDashboardMetrics,
	getLandingProfiles,
	getMonthlyReport,
	getMyWorkshopCommissions,
	getProfile,
	getSession,
	getStudentReport,
	getStudents,
	getSubjectHistory,
	getSubjectRoster,
	getSuperAdminAnalytics,
	getUnseenAlertsCount,
	getUsers,
	getWorkshopAttendance,
	getWorkshopCommissions,
	weeklyTrendFromRecords,
} from './selectors';

const state = createSeedState();

/** Fails the test with a message when a lookup returns no value (avoids `!`). */
function required<T>(value: T | null | undefined, label: string): T {
	if (value === null || value === undefined) {
		throw new Error(`expected ${label} to exist`);
	}
	return value;
}

describe('session / profile / landing', () => {
	it('starts without a session', () => {
		expect(getSession(state)).toEqual({ user: null, tenant: null });
	});

	it('getProfile resolves the superadmin without tenant', () => {
		const profile = required(
			getProfile(state, demoIds.user['carlos-ramos']),
			'carlos profile',
		);
		expect(profile.firstName).toBe('Carlos');
		expect(profile.tenantId).toBeUndefined();
	});

	it('getProfile resolves tenant name for a member', () => {
		const profile = required(
			getProfile(state, demoIds.user['ana-gomez']),
			'ana profile',
		);
		expect(profile.tenantName).toBe('Colegio San Martín');
	});

	it('getLandingProfiles lists every profile with tenant info', () => {
		const profiles = getLandingProfiles(state);
		expect(profiles).toHaveLength(7);
		const ana = required(
			profiles.find((profile) => profile.user.id === demoIds.user['ana-gomez']),
			'ana profile',
		);
		expect(ana.tenantName).toBe('Colegio San Martín');
		const carlos = required(
			profiles.find((profile) => profile.user.id === demoIds.user['carlos-ramos']),
			'carlos profile',
		);
		expect(carlos.tenantName).toBeNull();
	});
});

describe('students + users lists', () => {
	it('paginates students and supports search/filters', () => {
		const all = getStudents(state);
		expect(all.total).toBe(34);
		expect(all.items).toHaveLength(10); // default page size

		const course = getStudents(state, { courseId: demoIds.course['crs-1a'] });
		expect(course.total).toBe(12);

		const search = getStudents(state, { search: 'Sofía' });
		expect(search.total).toBe(1);
		expect(search.items[0]?.id).toBe(demoIds.student['sofia-rossi']);

		const inactive = getStudents(state, { status: 'INACTIVE' });
		expect(inactive.total).toBe(0);
	});

	it('filters users by role, tenant and text', () => {
		const preceptors = getUsers(state, { role: 'preceptor' });
		expect(preceptors.total).toBe(3);

		const tenant = getUsers(state, { tenantId: demoIds.tenant['san-martin'] });
		expect(tenant.total).toBe(6);

		const search = getUsers(state, { search: 'historia' });
		expect(search.total).toBe(1);
		expect(search.items[0]?.id).toBe(demoIds.user['elena-fernandez']);
	});
});

describe('attendance views', () => {
	it('getDailyAttendance reports metrics and at-risk students', () => {
		// 2026-06-09 was an absence day for Santiago Paz (daily course).
		const daily = required(
			getDailyAttendance(state, demoIds.course['crs-1a'], '2026-06-09'),
			'daily attendance',
		);
		expect(daily.metrics.totalStudents).toBe(12);
		expect(daily.metrics.absent).toBe(1);
		expect(daily.metrics.absentPercent).toBe(8.3);
		// Students at 10+ weighted absences, the heaviest first.
		expect(daily.metrics.studentsAtRisk.map((entry) => entry.studentId)).toEqual([
			demoIds.student['emma-villalba'],
			demoIds.student['santiago-paz'],
			demoIds.student['thiago-medina'],
		]);
		expect(daily.metrics.studentsAtRisk[0]).toMatchObject({
			absencePercent: 46.7,
		});
	});

	it('getSubjectHistory aggregates sessions and per-student percent', () => {
		const history = required(
			getSubjectHistory(state, demoIds.subject['sub-mat']),
			'subject history',
		);
		expect(history.classDates).toHaveLength(25); // Mon+Wed sessions
		expect(history.sessions).toHaveLength(25);
		expect(history.studentRecords).toHaveLength(12);
		const joaquin = required(
			history.studentRecords.find(
				(entry) => entry.studentId === demoIds.student['joaquin-diaz'],
			),
			'joaquin subject record',
		);
		expect(joaquin.absencePercent).toBe(12); // 3 absent / 25 sessions
	});
});

describe('alerts', () => {
	it('lists alerts newest first and counts unseen', () => {
		const result = getAlerts(state);
		expect(result.total).toBe(11);
		// Sofía crossed her warning threshold on the last seeded day.
		expect(result.items[0]).toMatchObject({
			studentId: demoIds.student['sofia-rossi'],
			alertType: 'warning',
			absenceCount: 10,
			threshold: 10,
		});
		expect(getUnseenAlertsCount(state)).toEqual({ count: 7 });

		const unseen = getAlerts(state, { unseenOnly: true });
		expect(unseen.total).toBe(7);
		expect(unseen.items.every((alert) => alert.seenAt === null)).toBe(true);
	});
});

describe('announcements', () => {
	it('lists announcements descending with status filter', () => {
		const all = getAnnouncements(state);
		expect(all.total).toBe(5);
		expect(all.items[0]?.id).toBe(demoIds.announcement['annc-4']); // newest first
		const published = getAnnouncements(state, { status: 'published' });
		expect(published.total).toBe(4);
	});

	it('for-me: admin sees only the school-wide announcements', () => {
		const ids = getAnnouncementsForMe(state, demoIds.user['ana-gomez']).map(
			(item) => item.id,
		);
		// The non-working day notice comes first (newer).
		expect(ids).toEqual([
			demoIds.announcement['annc-5'],
			demoIds.announcement['annc-1'],
		]);
	});

	it('for-me: primaria preceptor sees only the school-wide announcements', () => {
		const ids = getAnnouncementsForMe(state, demoIds.user['roberto-lopez']).map(
			(item) => item.id,
		);
		expect(ids).toEqual([
			demoIds.announcement['annc-5'],
			demoIds.announcement['annc-1'],
		]);
	});

	it('for-me: secundaria preceptor sees her course announcements (newest first)', () => {
		const ids = getAnnouncementsForMe(state, demoIds.user['laura-martinez']).map(
			(item) => item.id,
		);
		expect(ids).toEqual([
			demoIds.announcement['annc-3'],
			demoIds.announcement['annc-2'],
			demoIds.announcement['annc-5'],
			demoIds.announcement['annc-1'],
		]);
	});

	it('for-me: teachers resolve announcements through subject courses', () => {
		const javier = getAnnouncementsForMe(state, demoIds.user['javier-perez']).map(
			(item) => item.id,
		);
		expect(javier).toEqual([
			demoIds.announcement['annc-3'],
			demoIds.announcement['annc-2'],
			demoIds.announcement['annc-5'],
			demoIds.announcement['annc-1'],
		]);
	});
});

describe('dashboard', () => {
	it('builds course snapshots with demo rules and product risk colors', () => {
		const snapshots = getCourseSnapshots(state);
		expect(snapshots).toHaveLength(3);

		const primaria = required(
			snapshots.find((snap) => snap.courseId === demoIds.course['crs-1a']),
			'primaria snapshot',
		);
		// Weighted absences (late 0.25, late beyond tolerance 0.5).
		expect(primaria.absent).toBe(55.75);
		expect(primaria.late).toBe(33);
		expect(primaria.notRecorded).toBe(0);
		expect(primaria.absencePercent).toBe(7.7);
		expect(primaria.attendancePercent).toBe(92.3);
		expect(primaria.statusColor).toBe('OK');
		expect(primaria.workshopOnly).toBe(false);

		const secundaria = required(
			snapshots.find((snap) => snap.courseId === demoIds.course['crs-3a']),
			'secundaria snapshot',
		);
		expect(secundaria.absent).toBe(45);
		expect(secundaria.statusColor).toBe('OK');

		const tecnica = required(
			snapshots.find((snap) => snap.courseId === demoIds.course['crs-7a']),
			'7th year snapshot',
		);
		expect(tecnica.workshopOnly).toBe(true);
		expect(tecnica.notRecorded).toBe(0);
	});

	it('computes average attendance and weekly trend', () => {
		const metrics = getDashboardMetrics(state);
		// Mean of the course snapshots (92.3%, 93.7% and 88.2%).
		expect(metrics.averageAttendance).toBe(91.4);
		expect(metrics.coursesAtRisk).toHaveLength(0);
		expect(metrics.weeklyTrend.length).toBeGreaterThanOrEqual(6);
		expect(
			metrics.weeklyTrend.every(
				(point) => point.percent >= 0 && point.percent <= 100,
			),
		).toBe(true);
		// Ascending by week.
		const weeks = metrics.weeklyTrend.map((point) =>
			point.mondayWeek.toISOString().slice(0, 10),
		);
		expect([...weeks].sort()).toEqual(weeks);
	});

	it('scopes the weekly trend to the requested courses', () => {
		const courseId = demoIds.course['crs-1a'];
		const metrics = getDashboardMetrics(state, [courseId]);
		const expectedTrend = weeklyTrendFromRecords(
			state.attendance.filter((record) => record.courseId === courseId),
		);

		expect(metrics.weeklyTrend).toEqual(expectedTrend);
	});
});

describe('reports', () => {
	it('monthly report (June 2026, crs-3a) weights absences over the days given', () => {
		const report = required(
			getMonthlyReport(state, demoIds.course['crs-3a'], 6, 2026),
			'monthly report',
		);
		expect(report.workingDays).toBe(14);
		expect(report.students).toHaveLength(12);

		const sofia = required(
			report.students.find(
				(student) => student.studentId === demoIds.student['sofia-rossi'],
			),
			'sofia report entry',
		);
		expect(sofia.absent).toBe(3);
		expect(sofia.daysGiven).toBe(14);
		expect(sofia.absencePercent).toBe(21.4); // 3 weighted absences / 14 days
		// She reached 10 weighted absences by the end of June.
		expect(sofia.status).toBe('at-risk');
		expect(sofia.absenceBreakdown).toEqual({ daily: 3, workshop: 0 });

		// Late beyond tolerance weighs 0.5 and counts as a late arrival.
		const martina = required(
			report.students.find(
				(student) => student.studentId === demoIds.student['martina-acuna'],
			),
			'martina report entry',
		);
		expect(martina.absent).toBe(0.5);
		expect(martina.late).toBe(1);

		expect(report.summary.studentsAtRisk).toBe(2);
		expect(report.summary.studentsExceeded).toBe(0);
		expect(report.summary.averageAttendance).toBe(95);
	});

	it('monthly report counts justified absences in the weighted total', () => {
		const report = required(
			getMonthlyReport(state, demoIds.course['crs-3a'], 6, 2026),
			'monthly report',
		);
		const mateo = required(
			report.students.find(
				(student) => student.studentId === demoIds.student['mateo-gimenez'],
			),
			'mateo report entry',
		);
		expect(mateo.justified).toBe(1);
		expect(mateo.absent).toBe(1);
		expect(mateo.absencePercent).toBe(7.1);
	});

	it('workshop-only course reports over its workshop days', () => {
		const report = required(
			getMonthlyReport(state, demoIds.course['crs-7a'], 6, 2026),
			'7th year report',
		);
		expect(report.workingDays).toBe(14);
		const kevin = required(
			report.students.find(
				(student) => student.studentId === demoIds.student['kevin-maidana'],
			),
			'kevin report entry',
		);
		// A single shift: a workshop absence weighs the full day.
		expect(kevin.absent).toBe(2);
		expect(kevin.absenceBreakdown).toEqual({ daily: 0, workshop: 2 });
		expect(kevin.daysGiven).toBe(8);
	});

	it('course summary covers the months with activity', () => {
		const summary = getCourseSummary(state, demoIds.course['crs-3a']);
		expect(summary.length).toBe(4); // March to June
		expect(summary.every((entry) => (entry.averageAttendance ?? 0) > 0)).toBe(
			true,
		);
	});

	it('student report exposes monthly entries and totals', () => {
		const report = required(
			getStudentReport(state, demoIds.student['joaquin-diaz']),
			'student report',
		);
		expect(report.months).toHaveLength(4); // March to June
		expect(report.totals.absent).toBe(20);
		expect(report.totals.totalDays).toBe(60);
		expect(report.totals.absenceBreakdown).toEqual({ daily: 20, workshop: 0 });
		expect(report.totals.averageAbsencePercent).toBe(33.3);
		expect(report.status).toBe('at-risk');
		expect(report.alerts).toEqual([
			{ status: 'critical' },
			{ status: 'warning' },
		]);
	});

	it('halves daily and workshop absences on a contraturno day', () => {
		const report = required(
			getStudentReport(state, demoIds.student['camila-sosa']),
			'camila report',
		);
		// Three days missing both shifts: 3 x (1/2 + 1/2) = 3, half from each shift.
		expect(report.totals.absent).toBe(3);
		expect(report.totals.absenceBreakdown).toEqual({
			daily: 1.5,
			workshop: 1.5,
		});
	});
});

describe('workshop commissions', () => {
	const crs7a = demoIds.course['crs-7a'];

	it('lists the commissions of a course with code and alphabetical students', () => {
		const commissions = getWorkshopCommissions(state, crs7a);
		expect(commissions.map((c) => c.code)).toEqual(['7A1', '7A2']);
		expect(commissions.map((c) => c.studentCount)).toEqual([5, 5]);
		expect(commissions[0]?.students.map((s) => s.lastName)).toEqual([
			'Barrios',
			'Caruso',
			'Domínguez',
			'Escobar',
			'Funes',
		]);
		expect(getWorkshopCommissions(state, demoIds.course['crs-1a'])).toEqual([]);
	});

	it('lets admins take attendance of every commission and preceptors of theirs', () => {
		const admin = getMyWorkshopCommissions(
			state,
			{ id: demoIds.user['ana-gomez'], role: 'admin' },
			'2026-06-15',
		);
		expect(admin.map((c) => c.code)).toEqual(['3A1', '3A2', '7A1', '7A2']);

		const marcelo = getMyWorkshopCommissions(
			state,
			{ id: demoIds.user['marcelo-torres'], role: 'preceptor' },
			'2026-06-15', // Monday
		);
		expect(marcelo.map((c) => c.code)).toEqual(['3A2', '7A2']);
		// 3A2 has workshop on Mondays; 7A2 only Tuesdays, Thursdays and Fridays.
		expect(marcelo.map((c) => c.hasWorkshopToday)).toEqual([true, false]);
	});

	it('lists the commission roster with the status taken on a date', () => {
		const attendance = required(
			getWorkshopAttendance(state, demoIds.commission['c-7a-2'], '2026-06-16'),
			'workshop attendance',
		);
		expect(attendance.commissionCode).toBe('7A2');
		expect(attendance.records).toHaveLength(5);
		expect(attendance.records.every((record) => record.status !== null)).toBe(
			true,
		);

		const untaken = required(
			getWorkshopAttendance(state, demoIds.commission['c-7a-2'], '2026-06-15'),
			'workshop attendance',
		);
		expect(untaken.records.every((record) => record.status === null)).toBe(true);
	});

	it('scopes a workshop subject roster to the commissions its slots target', () => {
		// Taller de Informática: commission 1 on Tue/Thu, commission 2 on Mon/Wed.
		const tuesday = getSubjectRoster(
			state,
			demoIds.subject['sub-taller'],
			'2026-06-16',
		);
		expect(tuesday).toHaveLength(6);
		expect(
			tuesday.every(
				(student) => student.workshopCommissionId === demoIds.commission['c-3a-1'],
			),
		).toBe(true);
		// A theory subject lists the whole course.
		expect(getSubjectRoster(state, demoIds.subject['sub-mat'])).toHaveLength(12);
		// Automatización has a whole-course slot.
		expect(getSubjectRoster(state, demoIds.subject['sub-autom'])).toHaveLength(
			10,
		);
	});

	it('has no daily attendance for the workshop-only course', () => {
		const daily = required(
			getDailyAttendance(state, crs7a, '2026-06-16'),
			'daily attendance',
		);
		expect(daily.records).toEqual([]);
	});
});

describe('super admin analytics', () => {
	it('aggregates tenants, users and monthly trend', () => {
		const analytics = getSuperAdminAnalytics(state);
		expect(analytics.totals).toEqual({
			totalTenants: 3,
			activeTenants: 2,
			inactiveTenants: 1,
			totalUsers: 7,
		});
		const sanMartin = required(
			analytics.perTenant.find(
				(tenant) => tenant.id === demoIds.tenant['san-martin'],
			),
			'san-martin analytics',
		);
		expect(sanMartin.userCount).toBe(6);
		expect(analytics.tenantsTrend).toEqual([
			{ month: '2024-03', count: 1 },
			{ month: '2025-02', count: 1 },
			{ month: '2026-03', count: 1 },
		]);
	});
});
