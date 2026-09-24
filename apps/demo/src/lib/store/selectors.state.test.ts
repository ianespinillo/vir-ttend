import { describe, expect, it } from 'vitest';
import { createSeedState } from './seed-data.js';
import { demoIds } from './seed-data.js';
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
	getProfile,
	getSession,
	getStudentReport,
	getStudents,
	getSubjectHistory,
	getSuperAdminAnalytics,
	getUnseenAlertsCount,
	getUsers,
} from './selectors.js';

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
		expect(profiles).toHaveLength(6);
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
		expect(all.total).toBe(24);
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
		expect(preceptors.total).toBe(2);

		const tenant = getUsers(state, { tenantId: demoIds.tenant['san-martin'] });
		expect(tenant.total).toBe(5);

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
		expect(daily.metrics.studentsAtRisk[0]).toMatchObject({
			studentId: demoIds.student['santiago-paz'],
			absencePercent: 13.3,
		});
	});

	it('getSubjectHistory aggregates sessions and per-student percent', () => {
		const history = required(
			getSubjectHistory(state, demoIds.subject['sub-mat']),
			'subject history',
		);
		expect(history.classDates).toHaveLength(11); // Mon+Wed sessions
		expect(history.sessions).toHaveLength(11);
		expect(history.studentRecords).toHaveLength(12);
		const joaquin = required(
			history.studentRecords.find(
				(entry) => entry.studentId === demoIds.student['joaquin-diaz'],
			),
			'joaquin subject record',
		);
		expect(joaquin.absencePercent).toBe(27.3); // 3 absent / 11 sessions
	});
});

describe('alerts', () => {
	it('lists alerts newest first and counts unseen', () => {
		const result = getAlerts(state);
		expect(result.total).toBe(3);
		expect(result.items.map((alert) => alert.studentId)).toEqual([
			demoIds.student['joaquin-diaz'],
			demoIds.student['sofia-rossi'],
			demoIds.student['santiago-paz'],
		]);
		expect(getUnseenAlertsCount(state)).toEqual({ count: 2 });

		const unseen = getAlerts(state, { unseenOnly: true });
		expect(unseen.total).toBe(2);
		expect(unseen.items.every((alert) => alert.seenAt === null)).toBe(true);
	});
});

describe('announcements', () => {
	it('lists announcements descending with status filter', () => {
		const all = getAnnouncements(state);
		expect(all.total).toBe(4);
		expect(all.items[0]?.id).toBe(demoIds.announcement['annc-4']); // newest first
		const published = getAnnouncements(state, { status: 'published' });
		expect(published.total).toBe(3);
	});

	it('for-me: admin sees only the school-wide announcement', () => {
		const ids = getAnnouncementsForMe(state, demoIds.user['ana-gomez']).map(
			(item) => item.id,
		);
		expect(ids).toEqual([demoIds.announcement['annc-1']]);
	});

	it('for-me: primaria preceptor sees only the school-wide announcement', () => {
		const ids = getAnnouncementsForMe(state, demoIds.user['roberto-lopez']).map(
			(item) => item.id,
		);
		expect(ids).toEqual([demoIds.announcement['annc-1']]);
	});

	it('for-me: secundaria preceptor sees her course announcements (newest first)', () => {
		const ids = getAnnouncementsForMe(state, demoIds.user['laura-martinez']).map(
			(item) => item.id,
		);
		expect(ids).toEqual([
			demoIds.announcement['annc-3'],
			demoIds.announcement['annc-2'],
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
			demoIds.announcement['annc-1'],
		]);
	});
});

describe('dashboard', () => {
	it('builds course snapshots with demo rules and product risk colors', () => {
		const snapshots = getCourseSnapshots(state);
		expect(snapshots).toHaveLength(2);

		const primaria = required(
			snapshots.find((snap) => snap.courseId === demoIds.course['crs-1a']),
			'primaria snapshot',
		);
		expect(primaria.absent).toBe(5);
		expect(primaria.late).toBe(1);
		expect(primaria.notRecorded).toBe(0);
		expect(primaria.absencePercent).toBe(1.4);
		expect(primaria.attendancePercent).toBe(98.6);
		expect(primaria.statusColor).toBe('OK');

		const secundaria = required(
			snapshots.find((snap) => snap.courseId === demoIds.course['crs-3a']),
			'secundaria snapshot',
		);
		expect(secundaria.absent).toBe(11);
		expect(secundaria.statusColor).toBe('OK');
	});

	it('computes average attendance and weekly trend', () => {
		const metrics = getDashboardMetrics(state);
		// Mean of the course snapshots (98.6% and 96.4%).
		expect(metrics.averageAttendance).toBe(97.5);
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
});

describe('reports', () => {
	it('monthly report (June 2026, crs-3a) matches the seeded profiles', () => {
		const report = required(
			getMonthlyReport(state, demoIds.course['crs-3a'], 6, 2026),
			'monthly report',
		);
		expect(report.workingDays).toBe(15);
		expect(report.students).toHaveLength(12);

		const sofia = required(
			report.students.find(
				(student) => student.studentId === demoIds.student['sofia-rossi'],
			),
			'sofia report entry',
		);
		expect(sofia.absent).toBe(2);
		expect(sofia.absencePercent).toBe(11.1); // 2 of her 18 June sessions
		expect(sofia.status).toBe('at-risk');

		const joaquin = required(
			report.students.find(
				(student) => student.studentId === demoIds.student['joaquin-diaz'],
			),
			'joaquin report entry',
		);
		expect(joaquin.absent).toBe(4);
		expect(joaquin.status).toBe('exceeded');

		expect(report.summary.studentsAtRisk).toBe(1);
		expect(report.summary.studentsExceeded).toBe(1);
		// (100 − 11.1 − 22.2 − 5.6 + 100×9) / 12, computed per student session.
		expect(report.summary.averageAttendance).toBe(96.8);
	});

	it('monthly report keeps justified absences out of the absent count', () => {
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
		expect(mateo.justified).toBe(2);
		expect(mateo.absent).toBe(0);
		expect(mateo.absencePercent).toBe(0);
	});

	it('course summary covers the months with activity', () => {
		const summary = getCourseSummary(state, demoIds.course['crs-3a']);
		expect(summary.length).toBe(2);
		expect(summary.every((entry) => entry.averageAttendance > 0)).toBe(true);
	});

	it('student report exposes monthly entries and totals', () => {
		const report = required(
			getStudentReport(state, demoIds.student['joaquin-diaz']),
			'student report',
		);
		expect(report.months).toHaveLength(2); // May + June
		expect(report.totals.absent).toBe(6);
		expect(report.totals.totalDays).toBe(30); // distinct session dates (15 + 15)
		expect(report.status).toBe('exceeded');
		expect(report.alerts).toEqual([{ status: 'critical' }]);
	});
});

describe('super admin analytics', () => {
	it('aggregates tenants, users and monthly trend', () => {
		const analytics = getSuperAdminAnalytics(state);
		expect(analytics.totals).toEqual({
			totalTenants: 3,
			activeTenants: 2,
			inactiveTenants: 1,
			totalUsers: 6,
		});
		const sanMartin = required(
			analytics.perTenant.find(
				(tenant) => tenant.id === demoIds.tenant['san-martin'],
			),
			'san-martin analytics',
		);
		expect(sanMartin.userCount).toBe(5);
		expect(analytics.tenantsTrend).toEqual([
			{ month: '2024-03', count: 1 },
			{ month: '2025-02', count: 1 },
			{ month: '2026-03', count: 1 },
		]);
	});
});
