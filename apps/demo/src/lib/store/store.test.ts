import { describe, expect, it } from 'vitest';
import { createSeedState, demoIds } from './seed-data.js';
import { type DemoStore, createDemoStore } from './store.js';
import {
	DEMO_DEFAULT_PASSWORD,
	DEMO_TODAY,
	LEVEL,
	ROLES,
	SHIFT,
	STUDENTSTATUS,
} from './types.js';

function freshStore(): DemoStore {
	return createDemoStore(createSeedState(), null);
}

/** Fails the test with a message when a lookup returns no value (avoids `!`). */
function required<T>(value: T | null | undefined, label: string): T {
	if (value === null || value === undefined) {
		throw new Error(`expected ${label} to exist`);
	}
	return value;
}

describe('store basics', () => {
	it('exposes the seeded state as getState', () => {
		const store = freshStore();
		const state = store.getState();
		expect(state.students).toHaveLength(24);
		expect(state.session.userId).toBeNull();
	});

	it('notifies subscribers once per commit and supports unsubscribe', () => {
		const store = freshStore();
		let calls = 0;
		const unsubscribe = store.subscribe(() => {
			calls += 1;
		});
		store.setSession(demoIds.user['ana-gomez']);
		expect(calls).toBe(1);
		store.setSession(demoIds.user['ana-gomez']);
		expect(calls).toBe(2);
		unsubscribe();
		store.setSession(demoIds.user['roberto-lopez']);
		expect(calls).toBe(2);
	});

	it('never mutates the previous snapshot', () => {
		const store = freshStore();
		const before = store.getState();
		store.setSession(demoIds.user['ana-gomez']);
		expect(before.session.userId).toBeNull();
		expect(store.getState().session.userId).toBe(demoIds.user['ana-gomez']);
	});
});

describe('session + reset', () => {
	it('sets and clears the session', () => {
		const store = freshStore();
		store.setSession(demoIds.user['ana-gomez']);
		expect(store.getState().session).toEqual({
			userId: demoIds.user['ana-gomez'],
			tenantId: demoIds.tenant['san-martin'],
		});
		// An explicit tenant overrides the user default.
		store.setSession(demoIds.user['ana-gomez'], demoIds.tenant.belgrano);
		expect(store.getState().session?.tenantId).toBe(demoIds.tenant.belgrano);
		store.clearSession();
		expect(store.getState().session).toEqual({ userId: null, tenantId: null });
	});

	it('resets to a pristine deterministic seed', () => {
		const store = freshStore();
		store.setSession(demoIds.user['carlos-ramos']);
		const created = store.createUser({
			email: 'nuevo@virttend.com',
			firstName: 'Nuevo',
			lastName: 'Usuario',
		});
		store.markAnnouncementRead(created.id, demoIds.user['ana-gomez']);
		store.resetDemoState();
		expect(store.getState()).toEqual(createSeedState());
		expect(store.getState().session.userId).toBeNull();
	});
});

describe('users', () => {
	it('creates a user and returns temporary credentials', () => {
		const store = freshStore();
		const created = store.createUser({
			email: 'nuevo@virttend.com',
			firstName: 'Nuevo',
			lastName: 'Usuario',
			role: ROLES.PRECEPTOR,
			tenantId: demoIds.tenant['san-martin'],
		});
		expect(created.temporaryPassword).toBe(DEMO_DEFAULT_PASSWORD);
		expect(created.role).toBe(ROLES.PRECEPTOR);
		const stored = required(
			store.getState().users.find((user) => user.id === created.id),
			'created user',
		);
		expect(stored.isActive).toBe(true);
		expect(stored.mustChangePassword).toBe(true);
		expect(stored.tenantName).toBe('Colegio San Martín');
	});

	it('defaults role to admin when omitted', () => {
		const store = freshStore();
		const created = store.createUser({
			email: 'x@virttend.com',
			firstName: 'X',
			lastName: 'Y',
		});
		expect(created.role).toBe(ROLES.ADMIN);
	});

	it('updates, changes role, toggles status and resets password', () => {
		const store = freshStore();
		const id = demoIds.user['javier-perez'];
		const updated = store.updateUser(id, { lastName: 'Pérez Sosa' });
		expect(updated.lastName).toBe('Pérez Sosa');
		expect(store.getState().users.find((user) => user.id === id)?.lastName).toBe(
			'Pérez Sosa',
		);

		const reRole = store.changeRole(id, ROLES.ADMIN);
		expect(reRole.role).toBe(ROLES.ADMIN);

		store.toggleUserStatus(id, false);
		expect(store.getState().users.find((user) => user.id === id)?.isActive).toBe(
			false,
		);

		const reset = store.resetPassword(id);
		expect(reset.temporaryPassword).toBe(DEMO_DEFAULT_PASSWORD);
		expect(
			store.getState().users.find((user) => user.id === id)?.mustChangePassword,
		).toBe(true);
	});

	it('changePassword rejects a bad current password', () => {
		const store = freshStore();
		expect(() =>
			store.changePassword(demoIds.user['ana-gomez'], {
				oldPassword: 'incorrecta',
				newPassword: 'Nueva123!',
				confirmNewPassword: 'Nueva123!',
			}),
		).toThrow();
	});

	it('changePassword clears mustChangePassword on success', () => {
		const store = freshStore();
		store.resetPassword(demoIds.user['ana-gomez']);
		store.changePassword(demoIds.user['ana-gomez'], {
			oldPassword: DEMO_DEFAULT_PASSWORD,
			newPassword: 'Nueva123!',
			confirmNewPassword: 'Nueva123!',
		});
		expect(
			store.getState().users.find((user) => user.id === demoIds.user['ana-gomez'])
				?.mustChangePassword,
		).toBe(false);
	});
});

describe('tenants', () => {
	it('creates and toggles tenants', () => {
		const store = freshStore();
		const tenant = store.createTenant({
			name: 'Nueva Escuela',
			subdomain: 'nueva',
			contactEmail: 'contacto@nueva.edu.ar',
		});
		expect(tenant.isActive).toBe(true);
		expect(store.getState().tenants).toHaveLength(4);

		const toggled = store.toggleTenantStatus(tenant.id, false);
		expect(toggled.isActive).toBe(false);
		expect(
			store.getState().tenants.find((item) => item.id === tenant.id)?.isActive,
		).toBe(false);
	});
});

describe('students, courses, subjects', () => {
	it('creates a student tied to its course', () => {
		const store = freshStore();
		const student = store.createStudent({
			firstName: 'Lucas',
			lastName: 'Torres',
			documentNumber: '40123999',
			birthDate: '2013-05-20',
			courseId: demoIds.course['crs-3a'],
			tutorName: 'Pablo Torres',
			tutorPhone: '11-5555-6666',
		});
		expect(student.courseName).toBe('3º Año A');
		expect(student.status).toBe(STUDENTSTATUS.ACTIVE);
		expect(student.age).toBe(13);
		expect(store.getState().students).toHaveLength(25);
	});

	it('enrolls, transfers and deactivates students', () => {
		const store = freshStore();
		const id = demoIds.student['martin-benitez'];

		store.enrollStudent(id, demoIds.course['crs-3a']);
		expect(
			store.getState().students.find((student) => student.id === id)?.courseId,
		).toBe(demoIds.course['crs-3a']);

		store.transferStudent(id);
		expect(
			store.getState().students.find((student) => student.id === id)?.status,
		).toBe(STUDENTSTATUS.TRANSFERRED);

		store.toggleStudentStatus(id, false);
		expect(
			store.getState().students.find((student) => student.id === id)?.status,
		).toBe(STUDENTSTATUS.INACTIVE);
	});

	it('creates and updates courses and subjects', () => {
		const store = freshStore();
		const course = store.createCourse({
			academicYearId: demoIds.academicYear['ay-2026'],
			level: LEVEL.SECONDARY,
			yearNumber: 2,
			division: 'B',
			shift: SHIFT.MORNING,
			preceptorId: demoIds.user['laura-martinez'],
		});
		expect(course.fullName).toBe('2º B');
		expect(course.preceptorName).toBe('Laura Martínez');

		const updated = store.updateCourse(course.id, { division: 'C' });
		expect(updated.fullName).toBe('2º C');

		const subject = store.createSubject({
			courseId: course.id,
			name: 'Biología',
			area: 'Ciencias Naturales',
			weeklyHours: 3,
			teacherId: demoIds.user['elena-fernandez'],
		});
		expect(subject.teacherName).toBe('Elena Fernández');
	});
});

describe('attendance actions', () => {
	const date = '2026-06-19'; // a seeded business day (Friday)
	const target = '2026-06-22'; // Monday after DEMO_TODAY (no records yet)

	it('marks daily attendance (upsert semantics)', () => {
		const store = freshStore();
		const id = demoIds.student['martin-benitez'];
		store.markDailyAttendance(demoIds.course['crs-3a'], date, [
			{ studentId: id, status: 'absent' },
		]);
		const record = required(
			store
				.getState()
				.attendance.find(
					(item) => item.studentId === id && item.date === date && !item.subjectId,
				),
			'daily record',
		);
		expect(record.status).toBe('absent');
		// Updating keeps a single record per day+scope.
		store.markDailyAttendance(demoIds.course['crs-3a'], date, [
			{ studentId: id, status: 'late' },
		]);
		const records = store
			.getState()
			.attendance.filter(
				(item) => item.studentId === id && item.date === date && !item.subjectId,
			);
		expect(records).toHaveLength(1);
		expect(records[0]?.status).toBe('late');
	});

	it('marks subject attendance only in its scope', () => {
		const store = freshStore();
		const id = demoIds.student['sofia-rossi'];
		store.markSubjectAttendance(
			demoIds.subject['sub-mat'],
			demoIds.course['crs-3a'],
			date,
			[{ studentId: id, status: 'absent' }],
		);
		const state = store.getState();
		const subjectRecords = state.attendance.filter(
			(item) =>
				item.studentId === id &&
				item.date === date &&
				item.subjectId === demoIds.subject['sub-mat'],
		);
		expect(subjectRecords).toHaveLength(1);
		expect(subjectRecords[0]?.status).toBe('absent');
		// Fridays have a Lengua session for the same student — the Matemática
		// upsert must leave it untouched.
		const lengRecord = required(
			state.attendance.find(
				(item) =>
					item.studentId === id &&
					item.date === date &&
					item.subjectId === demoIds.subject['sub-leng'],
			),
			'lengua session',
		);
		expect(lengRecord.status).toBe('present');
	});

	it('marks the whole course roster', () => {
		const store = freshStore();
		store.markAllAttendance(demoIds.course['crs-1a'], target, 'absent');
		const state = store.getState();
		const targetRecords = state.attendance.filter(
			(item) =>
				item.courseId === demoIds.course['crs-1a'] &&
				item.date === target &&
				!item.subjectId,
		);
		expect(targetRecords).toHaveLength(12);
		expect(targetRecords.every((record) => record.status === 'absent')).toBe(
			true,
		);
	});

	it('copies the previous session into a new date', () => {
		const store = freshStore();
		// Previous Matemática session before target (2026-06-22): 2026-06-17.
		const previous = store
			.getState()
			.attendance.filter(
				(item) =>
					item.date === '2026-06-17' &&
					item.subjectId === demoIds.subject['sub-mat'],
			);
		expect(previous).toHaveLength(12);
		store.copyAttendance({
			subjectId: demoIds.subject['sub-mat'],
			targetDate: target,
		});
		const state = store.getState();
		const copied = state.attendance.filter(
			(item) =>
				item.date === target && item.subjectId === demoIds.subject['sub-mat'],
		);
		expect(copied).toHaveLength(12);
		// The copy mirrors the source session record by record.
		const sourceByStudent = new Map(
			previous.map((item) => [item.studentId, item.status]),
		);
		for (const item of copied) {
			expect(item.status).toBe(sourceByStudent.get(item.studentId));
		}
	});

	it('justifies an attendance record', () => {
		const store = freshStore();
		const id = demoIds.student['sofia-rossi'];
		const record = required(
			store
				.getState()
				.attendance.find(
					(item) =>
						item.studentId === id &&
						item.date === '2026-06-08' &&
						item.subjectId === demoIds.subject['sub-mat'],
				),
			'sofia matemática record',
		);
		expect(record.status).toBe('absent');
		const justified = store.justifyAttendance(record.id, {
			reason: 'Certificado médico',
			notes: 'Presentado por el tutor',
		});
		expect(justified.status).toBe('justified');
		expect(justified.justification?.reason).toBe('Certificado médico');
		expect(justified.justification?.createdBy).toBe('Demo');
	});
});

describe('alerts + announcements', () => {
	it('marks an alert as seen', () => {
		const store = freshStore();
		const alert = required(
			store
				.getState()
				.alerts.find((item) => item.studentId === demoIds.student['sofia-rossi']),
			'sofia alert',
		);
		expect(alert.seenAt).toBeNull();
		store.markAlertSeen(alert.id);
		expect(
			store.getState().alerts.find((item) => item.id === alert.id)?.seenAt,
		).toBeInstanceOf(Date);
	});

	it('creates, publishes, updates and deletes announcements', () => {
		const store = freshStore();
		const created = store.createAnnouncement({
			title: 'Título de prueba',
			body: 'Cuerpo de prueba',
			targetType: 'course',
			targetId: demoIds.course['crs-3a'],
			authorName: 'Ana María Gómez',
		});
		expect(created.status).toBe('draft');

		const published = store.publishAnnouncement(created.id);
		expect(published.status).toBe('published');
		expect(published.publishAt).not.toBeNull();
		expect(store.getState().announcements).toHaveLength(5);

		const updated = store.updateAnnouncement(created.id, {
			title: 'Título nuevo',
		});
		expect(updated.title).toBe('Título nuevo');

		store.deleteAnnouncement(created.id);
		expect(store.getState().announcements).toHaveLength(4);
	});

	it('records reads per user', () => {
		const store = freshStore();
		const userId = demoIds.user['ana-gomez'];
		store.markAnnouncementRead(demoIds.announcement['annc-1'], userId);
		store.markAnnouncementRead(demoIds.announcement['annc-1'], userId); // idempotent
		store.markAnnouncementRead(demoIds.announcement['annc-2'], userId);
		expect(store.getState().announcementReads[userId]).toEqual([
			demoIds.announcement['annc-1'],
			demoIds.announcement['annc-2'],
		]);
	});
});
