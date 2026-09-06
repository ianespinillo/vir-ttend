import type { Announcement, ICourseResponse, Roles } from '@repo/common';
import { ROLES } from '@repo/common';

export interface RelevantContexts {
	courseIds: string[];
	levels: string[];
}

export function dedupeById(lists: Announcement[][]): Announcement[] {
	const byId = new Map<string, Announcement>();
	for (const list of lists) {
		for (const item of list) byId.set(item.id, item);
	}
	return [...byId.values()].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);
}

export function resolveContexts(
	role: Roles,
	courses: Pick<ICourseResponse, 'id' | 'level'>[],
	subjectCourseIds: string[],
): RelevantContexts {
	if (role === ROLES.PRECEPTOR) {
		const seenLevels = new Set<string>();
		const levels: string[] = [];
		for (const c of courses) {
			const key = c.level.toLowerCase();
			if (!seenLevels.has(key)) {
				seenLevels.add(key);
				levels.push(key);
			}
		}
		return { courseIds: courses.map((c) => c.id), levels };
	}
	if (role === ROLES.TEACHER) {
		return { courseIds: [...new Set(subjectCourseIds)], levels: [] };
	}
	return { courseIds: [], levels: [] };
}
