import { isWorkshopOnlyCourse } from '@repo/common';
import { describe, expect, it } from 'vitest';
import { createSeedState, demoIds, demoUuid } from './seed-data';
import { calculateWeightedAbsences } from './weighted-absence';

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
		...state.workshopCommissions,
		...state.workshopAttendance,
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
		expect(state.users).toHaveLength(7);
		expect(state.academicYears).toHaveLength(1);
		expect(state.courses).toHaveLength(3);
		expect(state.subjects).toHaveLength(6);
		expect(state.schedules).toHaveLength(15);
		expect(state.students).toHaveLength(34); // 12 + 12 + 10
		expect(state.workshopCommissions).toHaveLength(4);
		expect(state.announcements).toHaveLength(5);
		expect(state.announcementReads).toEqual({});
		expect(state.session).toEqual({ userId: null, tenantId: null });
	});

	it('seeds 60 business days of attendance (daily + per-subject + workshop)', () => {
		const state = createSeedState();
		const days = new Set(state.attendance.map((record) => record.date));
		expect(days.size).toBe(60);
		// primaria + 3º Año A: 60 days x 24 students; 7º técnico has none.
		const daily = state.attendance.filter((record) => !record.subjectId);
		expect(daily).toHaveLength(1440);
		expect(
			daily.some((record) => record.courseId === demoIds.course['crs-7a']),
		).toBe(false);
		// Only the theory subjects of 3º Año A have per-subject records.
		const bySubject = new Set(
			state.attendance
				.filter((record) => record.subjectId)
				.map((record) => record.subjectId),
		);
		expect(bySubject).toEqual(
			new Set([
				demoIds.subject['sub-mat'],
				demoIds.subject['sub-hist'],
				demoIds.subject['sub-leng'],
			]),
		);
		expect(state.workshopAttendance.length).toBeGreaterThan(500);
	});

	it('uses late beyond tolerance and justified statuses', () => {
		const statuses = new Set(
			createSeedState().attendance.map((record) => record.status),
		);
		expect(statuses).toEqual(
			new Set(['present', 'absent', 'late', 'late_beyond_tolerance', 'justified']),
		);
	});

	it('no student has duplicate records for the same date+scope', () => {
		const state = createSeedState();
		const keys = new Set<string>();
		for (const record of state.attendance) {
			const key = `${record.studentId}:${record.date}:${record.subjectId ?? 'daily'}`;
			expect(keys.has(key)).toBe(false);
			keys.add(key);
		}
		const workshopKeys = new Set<string>();
		for (const record of state.workshopAttendance) {
			const key = `${record.studentId}:${record.date}`;
			expect(workshopKeys.has(key)).toBe(false);
			workshopKeys.add(key);
		}
	});

	it('justified records carry a justification', () => {
		const state = createSeedState();
		const justified = state.attendance.filter(
			(record) => record.status === 'justified',
		);
		expect(justified.length).toBeGreaterThan(0);
		for (const record of justified) {
			expect(record.justification?.reason).toMatch(
				/Certificado médico|Motivos familiares/,
			);
			expect(record.justification?.createdBy).toMatch(
				/Laura Martínez|Roberto López/,
			);
		}
	});
});

describe('seeded workshop commissions', () => {
	it('splits 3º Año A and 7º Año A alphabetically over two commissions', () => {
		const state = createSeedState();
		const sizes = state.workshopCommissions.map(
			(commission) =>
				state.students.filter(
					(student) => student.workshopCommissionId === commission.id,
				).length,
		);
		expect(sizes).toEqual([6, 6, 5, 5]);
		// Primaria has no workshop.
		expect(
			state.students
				.filter((student) => student.courseId === demoIds.course['crs-1a'])
				.every((student) => student.workshopCommissionId === undefined),
		).toBe(true);
	});

	it('assigns commission preceptors, including a workshop-only preceptor', () => {
		const state = createSeedState();
		const preceptors = state.workshopCommissions.map(
			(commission) => commission.preceptorId,
		);
		expect(preceptors).toEqual([
			demoIds.user['laura-martinez'],
			demoIds.user['marcelo-torres'],
			demoIds.user['laura-martinez'],
			demoIds.user['marcelo-torres'],
		]);
	});

	it('marks the 7th year as workshop-only and keeps workshop subjects teachers by name', () => {
		const state = createSeedState();
		const seventh = state.courses.find(
			(course) => course.id === demoIds.course['crs-7a'],
		);
		expect(seventh).toMatchObject({ level: 'SECONDARY', yearNumber: 7 });
		const electro = state.subjects.find(
			(subject) => subject.id === demoIds.subject['sub-electro'],
		);
		expect(electro?.kind).toBe('workshop');
		expect(electro?.teacherId).toBeUndefined();
		expect(electro?.teacherName).toBe('Roberto Sáenz');
	});
});

describe('seeded non-working day', () => {
	it('declares the institutional day, skips it and announces it', () => {
		const state = createSeedState();
		const year = state.academicYears[0];
		const days = (year?.nonWorkingDays ?? []).map((day) =>
			day.toISOString().slice(0, 10),
		);
		expect(days).toContain('2026-06-12');
		expect(days).toContain('2026-05-25'); // national holiday
		const dates = new Set([
			...state.attendance.map((record) => record.date),
			...state.workshopAttendance.map((record) => record.date),
		]);
		for (const day of days) expect(dates.has(day)).toBe(false);

		const announcement = state.announcements.find(
			(item) => item.id === demoIds.announcement['annc-5'],
		);
		expect(announcement?.status).toBe('published');
		expect(announcement?.targetType).toBe('school');
		expect(announcement?.title).toContain('Jornada institucional');
	});
});

describe('seeded alerts', () => {
	const slugOf = new Map(
		Object.entries(demoIds.student).map(([slug, id]) => [id, slug]),
	);

	it('replays the history through the 10 / 20 / cap thresholds', () => {
		const state = createSeedState();
		const raised = state.alerts
			.map((alert) => `${slugOf.get(alert.studentId)}:${alert.alertType}`)
			.sort();
		expect(raised).toEqual([
			'daniela-escobar:critical',
			'daniela-escobar:warning',
			'emma-villalba:critical',
			'emma-villalba:exceeded',
			'emma-villalba:warning',
			'joaquin-diaz:critical',
			'joaquin-diaz:warning',
			'kevin-maidana:warning',
			'santiago-paz:warning',
			'sofia-rossi:warning',
			'thiago-medina:warning',
		]);
	});

	it('leaves some alerts seen and the rest unread', () => {
		const state = createSeedState();
		const seen = state.alerts.filter((alert) => alert.seenAt !== null);
		expect(seen).toHaveLength(4);
		expect(state.alerts.filter((alert) => alert.seenAt === null)).toHaveLength(7);
	});

	it('every alert reaches its threshold (10 / 20 / 28)', () => {
		const thresholds = { warning: 10, critical: 20, exceeded: 28 };
		for (const alert of createSeedState().alerts) {
			expect(alert.threshold).toBe(thresholds[alert.alertType]);
			expect(alert.absenceCount).toBeGreaterThanOrEqual(alert.threshold);
		}
	});

	it('alert absenceCount equals the weighted count at the crossing day', () => {
		const state = createSeedState();
		for (const alert of state.alerts) {
			const day = alert.createdAt.toISOString().slice(0, 10);
			const student = state.students.find((item) => item.id === alert.studentId);
			const course = state.courses.find((item) => item.id === student?.courseId);
			const { total } = calculateWeightedAbsences({
				dailyRecords: state.attendance.filter(
					(record) =>
						record.studentId === alert.studentId &&
						!record.subjectId &&
						record.date <= day,
				),
				workshopRecords: state.workshopAttendance.filter(
					(record) => record.studentId === alert.studentId && record.date <= day,
				),
				workshopOnly: course ? isWorkshopOnlyCourse(course) : false,
			});
			expect(alert.absenceCount).toBe(total);
		}
	});

	it('late arrivals alone can raise an alert (Thiago: 16 x 0.25 + 12 x 0.5)', () => {
		const state = createSeedState();
		const thiago = state.alerts.find(
			(alert) => alert.studentId === demoIds.student['thiago-medina'],
		);
		expect(thiago?.alertType).toBe('warning');
		expect(thiago?.absenceCount).toBe(10);
		const absences = state.attendance.filter(
			(record) =>
				record.studentId === demoIds.student['thiago-medina'] &&
				record.status === 'absent',
		);
		expect(absences).toHaveLength(0);
	});

	it('regular students carry no alerts', () => {
		const state = createSeedState();
		const alertStudentIds = new Set(state.alerts.map((alert) => alert.studentId));
		for (const slug of [
			'martin-benitez',
			'lucia-morales',
			'mateo-gimenez',
			'valentina-fernandez',
			'camila-sosa',
			'jazmin-luna',
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
