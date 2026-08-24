import type { Announcement, ICourseResponse } from '@repo/common';
import { LEVEL, ROLES } from '@repo/common';
import { describe, expect, it } from 'vitest';
import { dedupeById, resolveContexts } from './relevant-announcements';

const annc = (id: string, createdAt: string): Announcement => ({
	id,
	title: id,
	body: '',
	targetType: 'school',
	targetId: '',
	status: 'published',
	publishAt: null,
	authorName: '',
	createdAt,
});

describe('dedupeById', () => {
	it('une listas, elimina duplicados y ordena desc por createdAt', () => {
		const merged = dedupeById([
			[annc('a', '2026-08-01T10:00:00Z'), annc('b', '2026-08-03T10:00:00Z')],
			[annc('a', '2026-08-01T10:00:00Z'), annc('c', '2026-08-02T10:00:00Z')],
		]);
		expect(merged.map((a) => a.id)).toEqual(['b', 'c', 'a']);
	});
});

describe('resolveContexts', () => {
	it('preceptor deriva courseIds y levels lowercase desde sus cursos', () => {
		const courses: Pick<ICourseResponse, 'id' | 'level'>[] = [
			{ id: 'c1', level: LEVEL.PRIMARY },
			{ id: 'c2', level: LEVEL.SECONDARY },
		];
		expect(resolveContexts(ROLES.PRECEPTOR, courses, [])).toEqual({
			courseIds: ['c1', 'c2'],
			levels: ['primary', 'secondary'],
		});
	});

	it('teacher usa los courseIds de sus materias (sin niveles)', () => {
		expect(resolveContexts(ROLES.TEACHER, [], ['s1', 's1', 's2'])).toEqual({
			courseIds: ['s1', 's2'],
			levels: [],
		});
	});

	it('admin/superadmin no tienen contexto personal', () => {
		expect(resolveContexts(ROLES.ADMIN, [], [])).toEqual({
			courseIds: [],
			levels: [],
		});
	});
});
