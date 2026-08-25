import { describe, expect, it } from 'vitest';
import {
	createAnnouncementSchema,
	serializePublishAt,
} from './announcement.schema.js';

describe('createAnnouncementSchema', () => {
	const base = { title: 'Reunión', body: 'Contenido' };

	it('acepta targeting school sin targetId', () => {
		const res = createAnnouncementSchema.safeParse({
			...base,
			targetType: 'school',
		});
		expect(res.success).toBe(true);
	});

	it('exige uuid cuando targetType es course', () => {
		const bad = createAnnouncementSchema.safeParse({
			...base,
			targetType: 'course',
			targetId: '',
		});
		expect(bad.success).toBe(false);

		const ok = createAnnouncementSchema.safeParse({
			...base,
			targetType: 'course',
			targetId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
		});
		expect(ok.success).toBe(true);
	});

	it('solo acepta primary|secondary cuando targetType es level', () => {
		expect(
			createAnnouncementSchema.safeParse({
				...base,
				targetType: 'level',
				targetId: 'primary',
			}).success,
		).toBe(true);
		expect(
			createAnnouncementSchema.safeParse({
				...base,
				targetType: 'level',
				targetId: 'PRIMARY',
			}).success,
		).toBe(false);
	});

	it('rechaza título vacío', () => {
		expect(
			createAnnouncementSchema.safeParse({
				title: '',
				body: 'x',
				targetType: 'school',
			}).success,
		).toBe(false);
	});

	it('valida publishAt en formato datetime-local si viene', () => {
		expect(
			createAnnouncementSchema.safeParse({
				...base,
				targetType: 'school',
				publishAt: '2026-09-01T10:30',
			}).success,
		).toBe(true);
		expect(
			createAnnouncementSchema.safeParse({
				...base,
				targetType: 'school',
				publishAt: 'no-es-fecha',
			}).success,
		).toBe(false);
	});
});

describe('serializePublishAt', () => {
	it('convierte datetime-local a ISO o null', () => {
		expect(serializePublishAt('2026-09-01T10:30')).toBe(
			new Date('2026-09-01T10:30').toISOString(),
		);
		expect(serializePublishAt(null)).toBeNull();
		expect(serializePublishAt(undefined)).toBeUndefined();
	});
});
