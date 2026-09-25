import { ROLES } from '@repo/common';
import { describe, expect, it } from 'vitest';
import {
	getScopedCourseIds,
	getScopedSubjects,
} from '../academic/academic-mappings.js';
import {
	getScopedAttendanceCourseIds,
	getScopedAttendanceSubjects,
} from '../attendance/attendance-mappings.js';
import * as selectors from '../store/selectors.js';
import { createDemoStore } from '../store/store.js';

describe('Demo App End-to-End Smoke & Integration Suite', () => {
	it('loads fresh seed state with full data graph intact', () => {
		const store = createDemoStore();
		const state = store.getState();

		expect(state.users.length).toBeGreaterThanOrEqual(6);
		expect(state.tenants.length).toBeGreaterThanOrEqual(3);
		expect(state.courses.length).toBeGreaterThanOrEqual(2);
		expect(state.subjects.length).toBeGreaterThanOrEqual(3);
		expect(state.students.length).toBeGreaterThanOrEqual(20);
		expect(state.attendance.length).toBeGreaterThanOrEqual(100);
		expect(state.alerts.length).toBeGreaterThanOrEqual(3);
		expect(state.announcements.length).toBeGreaterThanOrEqual(4);
	});

	it('provides all required landing profiles', () => {
		const store = createDemoStore();
		const state = store.getState();
		const profiles = selectors.getLandingProfiles(state);

		expect(profiles.length).toBe(6);
		const roles = profiles.map((p) => p.user.role);
		expect(roles).toContain(ROLES.SUPERADMIN);
		expect(roles).toContain(ROLES.ADMIN);
		expect(roles).toContain(ROLES.PRECEPTOR);
		expect(roles).toContain(ROLES.TEACHER);
	});

	it('supports full session lifecycle across all roles', () => {
		const store = createDemoStore();
		const state = store.getState();
		const profiles = selectors.getLandingProfiles(state);

		for (const profile of profiles) {
			store.setSession(profile.user.id);
			const currentSession = selectors.getSession(store.getState());
			expect(currentSession.user?.id).toBe(profile.user.id);
			expect(currentSession.user?.role).toBe(profile.user.role);
		}

		store.clearSession();
		const cleared = selectors.getSession(store.getState());
		expect(cleared.user).toBeNull();
	});

	it('evaluates student list queries and detail lookup for demo showcase', () => {
		const store = createDemoStore();
		const state = store.getState();

		const studentsPage = selectors.getStudents(state, { page: 1, limit: 10 });
		expect(studentsPage.items.length).toBe(10);
		expect(studentsPage.total).toBeGreaterThanOrEqual(20);

		const firstStudent = studentsPage.items[0];
		expect(firstStudent).toBeDefined();
		if (firstStudent) {
			const detail = selectors.getStudentById(state, firstStudent.id);
			expect(detail).toBeDefined();
			expect(detail?.id).toBe(firstStudent.id);

			const totals = selectors.getStudentAttendanceTotals(state, firstStudent.id);
			expect(totals.totalSlots).toBeGreaterThan(0);
		}
	});

	it('correctly scopes academic courses and subjects per role', () => {
		const store = createDemoStore();
		const state = store.getState();
		const courses = selectors.getCourses(state);
		const subjects = selectors.getSubjects(state);

		// Admin sees all courses and subjects
		const adminCourses = getScopedCourseIds(
			courses,
			subjects,
			'admin-id',
			ROLES.ADMIN,
		);
		expect(adminCourses).toBeUndefined();
		const adminSubjects = getScopedSubjects(
			courses,
			subjects,
			'admin-id',
			ROLES.ADMIN,
		);
		expect(adminSubjects.length).toBe(subjects.length);

		// Preceptors and teachers are scoped
		const preceptor = state.users.find((u) => u.role === ROLES.PRECEPTOR);
		expect(preceptor).toBeDefined();
		if (preceptor) {
			const scopedCourseIds = getScopedCourseIds(
				courses,
				subjects,
				preceptor.id,
				ROLES.PRECEPTOR,
			);
			expect(Array.isArray(scopedCourseIds)).toBe(true);
		}
	});

	it('calculates attendance daily and subject grids correctly', () => {
		const store = createDemoStore();
		const state = store.getState();

		const courses = selectors.getCourses(state);
		const firstCourse = courses[0];
		expect(firstCourse).toBeDefined();
		if (!firstCourse) return;

		const courseStudents = selectors.getCourseStudents(state, firstCourse.id);
		expect(courseStudents.length).toBeGreaterThan(0);

		// Daily attendance for demo today
		const daily = selectors.getDailyAttendance(
			state,
			firstCourse.id,
			'2026-06-19',
		);
		expect(daily).toBeDefined();
		expect(daily?.courseId).toBe(firstCourse.id);

		// Subject attendance
		const subjects = selectors.getSubjects(state, firstCourse.id);
		if (subjects.length > 0) {
			const subject = subjects[0];
			if (subject) {
				const subjectAtt = selectors.getSubjectAttendance(
					state,
					subject.id,
					'2026-06-19',
				);
				if (subjectAtt) {
					expect(subjectAtt.subjectId).toBe(subject.id);
					expect(subjectAtt.metrics.totalStudents).toBeGreaterThan(0);
				}
			}
		}
	});

	it('handles alert inspection and reading', () => {
		const store = createDemoStore();
		const state = store.getState();

		const alerts = selectors.getAlerts(state, { unseenOnly: true });
		expect(alerts.items.length).toBeGreaterThanOrEqual(1);

		const firstAlert = alerts.items[0];
		expect(firstAlert).toBeDefined();
		if (firstAlert) {
			store.markAlertSeen(firstAlert.id);
			const updatedAlert = store
				.getState()
				.alerts.find((a) => a.id === firstAlert.id);
			expect(updatedAlert?.seenAt).not.toBeNull();
		}
	});

	it('supports announcements querying and creation', () => {
		const store = createDemoStore();
		const state = store.getState();

		const announcements = selectors.getAnnouncements(state);
		expect(announcements.items.length).toBeGreaterThanOrEqual(4);

		const created = store.createAnnouncement({
			title: 'Smoke Test Announcement',
			body: 'Contenido del anuncio de prueba',
			targetType: 'school',
			authorName: 'Tester Admin',
		});
		expect(created.id).toBeDefined();
		expect(created.status).toBe('draft');

		store.publishAnnouncement(created.id);
		const published = selectors.getAnnouncementById(store.getState(), created.id);
		expect(published?.status).toBe('published');
	});

	it('generates monthly attendance reports and summary trends', () => {
		const store = createDemoStore();
		const state = store.getState();

		const courses = selectors.getCourses(state);
		const firstCourse = courses[0];
		expect(firstCourse).toBeDefined();
		if (!firstCourse) return;

		const periods = selectors.getAvailableReportPeriods(state, firstCourse.id);
		expect(periods.length).toBeGreaterThan(0);

		const latest = periods[0];
		if (latest) {
			const report = selectors.getMonthlyReport(
				state,
				firstCourse.id,
				latest.month,
				latest.year,
			);
			expect(report).toBeDefined();
			expect(report?.students.length).toBeGreaterThan(0);

			const summary = selectors.getCourseSummary(state, firstCourse.id);
			expect(summary.length).toBeGreaterThan(0);
		}
	});

	it('handles user administration and credentials generation', () => {
		const store = createDemoStore();
		const state = store.getState();

		const userResult = store.createUser({
			firstName: 'Demo',
			lastName: 'Smoke',
			email: 'smoke.demo@virttend.com',
			role: ROLES.PRECEPTOR,
		});

		expect(userResult.id).toBeDefined();
		expect(userResult.temporaryPassword).toBe('Demo1234!');

		store.changeRole(userResult.id, ROLES.TEACHER);
		const updated = selectors.getUserById(store.getState(), userResult.id);
		expect(updated?.role).toBe(ROLES.TEACHER);

		store.toggleUserStatus(userResult.id, false);
		const deactivated = selectors.getUserById(store.getState(), userResult.id);
		expect(deactivated?.isActive).toBe(false);
	});

	it('handles tenant administration and toggling', () => {
		const store = createDemoStore();
		const state = store.getState();

		const tenants = selectors.getTenants(state);
		expect(tenants.length).toBeGreaterThanOrEqual(3);

		const newTenant = store.createTenant({
			name: 'Instituto Test',
			subdomain: 'test-inst',
			contactEmail: 'contacto@test.edu.ar',
		});

		expect(newTenant.id).toBeDefined();
		expect(newTenant.isActive).toBe(true);

		store.toggleTenantStatus(newTenant.id, false);
		const toggled = selectors
			.getTenants(store.getState())
			.find((t) => t.id === newTenant.id);
		expect(toggled?.isActive).toBe(false);
	});
});
