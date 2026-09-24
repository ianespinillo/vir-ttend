import { describe, expect, it } from 'vitest';
import { createSeedState, demoIds, demoUuid } from './seed-data.js';

const UUID_RE = /^[0-9a-f]{8}-0000-4000-8000-0000[0-9a-f]{8}$/;

function flatIds(state: ReturnType<typeof createSeedState>): string[] {
	const ids = new Set<string>();
	const push = (...items: Array<{ id: string } | undefined>) => {
		for (const item of items) if (item) ids.add(item.id);
	};
	for (const item of [
		...state.tenants,
		...state.users,
		...state.academicYears,
		...state.courses,
		...state.subjects,
		...state.schedules,
		...state.students,
		...state.attendance,
		...state.alerts,
		...state.announcements,
	]) {
		push(item);
	}
	return [...ids];
}

describe('createSeedState determinism', () => {
	it('generates value-equal states on every call', () => {
		const first = createSeedState();
		const second = createSeedState();
		expect(first).toEqual(second);
	});

	it('does not share mutable references between calls', () => {
		const first = createSeedState();
		const second = createSeedState();
		const firstUser = first.users[0];
		const firstStudent = first.students[0];
		if (!firstUser || !firstStudent) {
			throw new Error('expected seeded users and students');
		}
		firstUser.email = 'mutated@example.com';
		firstStudent.tutorName = 'Mutado';
		expect(second.users[0]?.email).toBe('superadmin@virttend.com');
		expect(second.students[0]?.tutorName).not.toBe('Mutado');
	});
});

describe('ids', () => {
	it('all fixed ids are uuidv4-format and unique', () => {
		const state = createSeedState();
		const ids = flatIds(state);
		for (const id of ids) {
			expect(id).toMatch(UUID_RE);
		}
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('demoUuid is deterministic and namespace-separated', () => {
		expect(demoUuid('user', 'carlos-ramos')).toMatch(UUID_RE);
		expect(demoUuid('user', 'carlos-ramos')).toBe(
			demoUuid('user', 'carlos-ramos'),
		);
		expect(demoUuid('user', 'ana-gomez')).not.toBe(
			demoUuid('user', 'carlos-ramos'),
		);
		expect(demoUuid('student', 'x')).not.toBe(demoUuid('user', 'x'));
	});

	it('exports the id catalog used elsewhere', () => {
		expect(demoIds.course['crs-3a']).toMatch(UUID_RE);
		expect(demoIds.user['carlos-ramos']).toBe(demoUuid('user', 'carlos-ramos'));
	});
});

describe('seed structure', () => {
	it('seeds the expected fixed dataset', () => {
		const state = createSeedState();
		expect(state.tenants).toHaveLength(3);
		expect(state.users).toHaveLength(6);
		expect(state.academicYears).toHaveLength(1);
		expect(state.courses).toHaveLength(2);
		expect(state.subjects).toHaveLength(3);
		expect(state.schedules).toHaveLength(6);
		expect(state.students).toHaveLength(24); // 12 per course
		expect(state.announcements).toHaveLength(4);
		expect(state.announcementReads).toEqual({});
		expect(state.session).toEqual({ userId: null, tenantId: null });
	});

	it('seeds 30 business days of attendance (daily + per-subject)', () => {
		const state = createSeedState();
		const days = new Set(state.attendance.map((record) => record.date));
		expect(days.size).toBe(30);
		// primaria: 30 days x 12 students = 360 daily records
		const daily = state.attendance.filter((record) => !record.subjectId);
		expect(daily).toHaveLength(360);
		// secundaria: (11 mat + 12 hist + 12 leng) sessions x 12 students = 420
		const bySubject = new Map<string, number>();
		for (const record of state.attendance) {
			if (record.subjectId) {
				bySubject.set(record.subjectId, (bySubject.get(record.subjectId) ?? 0) + 1);
			}
		}
		expect([...bySubject.values()]).toEqual([132, 144, 144]); // 11, 12, 12 sessions
		expect(state.attendance).toHaveLength(360 + 420);
	});

	it('no student has duplicate records for the same date+scope', () => {
		const state = createSeedState();
		const keys = new Set<string>();
		for (const record of state.attendance) {
			const key = `${record.studentId}:${record.date}:${record.subjectId ?? 'daily'}`;
			expect(keys.has(key)).toBe(false);
			keys.add(key);
		}
	});

	it('justified records carry a justification', () => {
		const state = createSeedState();
		const justified = state.attendance.filter(
			(record) => record.status === 'justified',
		);
		expect(justified).toHaveLength(4);
		for (const record of justified) {
			expect(record.justification?.reason).toMatch(
				/Certificado médico|Motivos familiares/,
			);
			expect(record.justification?.createdBy).toBe('Laura Martínez');
		}
	});
});

describe('seeded alerts', () => {
	it('seeds exactly Sofía (warning), Joaquín (critical), Santiago (warning, seen)', () => {
		const state = createSeedState();
		expect(state.alerts).toHaveLength(3);

		const byStudent = new Map(
			state.alerts.map((alert) => [alert.studentId, alert]),
		);
		expect(byStudent.get(demoIds.student['sofia-rossi'])?.alertType).toBe(
			'warning',
		);
		expect(byStudent.get(demoIds.student['joaquin-diaz'])?.alertType).toBe(
			'critical',
		);
		expect(byStudent.get(demoIds.student['santiago-paz'])?.alertType).toBe(
			'warning',
		);

		expect(byStudent.get(demoIds.student['sofia-rossi'])?.seenAt).toBeNull();
		expect(byStudent.get(demoIds.student['joaquin-diaz'])?.seenAt).toBeNull();
		expect(byStudent.get(demoIds.student['santiago-paz'])?.seenAt).toBeInstanceOf(
			Date,
		);
	});

	it('alert absencePercent matches the selectors math', () => {
		const state = createSeedState();
		const sofia = state.alerts.find(
			(alert) => alert.studentId === demoIds.student['sofia-rossi'],
		);
		const joaquin = state.alerts.find(
			(alert) => alert.studentId === demoIds.student['joaquin-diaz'],
		);
		const santiago = state.alerts.find(
			(alert) => alert.studentId === demoIds.student['santiago-paz'],
		);
		if (!sofia || !joaquin || !santiago) {
			throw new Error('expected seeded alerts');
		}
		// 4 absent / 35 subject sessions = 11.4%; 6/35 = 17.1%; 4/30 = 13.3%
		expect(sofia.absencePercent).toBe(11.4);
		expect(joaquin.absencePercent).toBe(17.1);
		expect(santiago.absencePercent).toBe(13.3);
	});

	it('regular students carry no alerts', () => {
		const state = createSeedState();
		const alertStudentIds = new Set(state.alerts.map((alert) => alert.studentId));
		for (const slug of [
			'martin-benitez',
			'lucia-morales',
			'mateo-gimenez',
			'valentina-fernandez',
		]) {
			expect(
				alertStudentIds.has(demoIds.student[slug as keyof typeof demoIds.student]),
			).toBe(false);
		}
	});
});

describe('seeded announcements', () => {
	it('maps targets per the demo plan', () => {
		const state = createSeedState();
		const byId = new Map(state.announcements.map((item) => [item.id, item]));
		expect(byId.get(demoIds.announcement['annc-1'])?.targetType).toBe('school');
		expect(byId.get(demoIds.announcement['annc-2'])?.targetType).toBe('course');
		expect(byId.get(demoIds.announcement['annc-2'])?.targetId).toBe(
			demoIds.course['crs-3a'],
		);
		expect(byId.get(demoIds.announcement['annc-3'])?.targetType).toBe('course');
		expect(byId.get(demoIds.announcement['annc-3'])?.targetId).toBe(
			demoIds.course['crs-3a'],
		);
		expect(byId.get(demoIds.announcement['annc-4'])?.status).toBe('draft');
	});
});
