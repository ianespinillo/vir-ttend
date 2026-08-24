'use client';

import {
	ANNOUNCEMENT_ROUTES,
	type Announcement,
	type ApiResponse,
	ROLES,
	type Roles,
} from '@repo/common';
import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';
import { useTeacherSubjects } from '../attendance/use-teacher-subjects';
import { useMyCourses } from '../courses/use-my-courses';
import {
	type RelevantContexts,
	dedupeById,
	resolveContexts,
} from './relevant-announcements';

export interface UseRelevantAnnouncementsParams {
	role?: Roles;
	userId?: string;
	academicYearId?: string;
}

type ForMeParams =
	| { courseId: string }
	| { level: string }
	| Record<string, never>;

async function fetchForMe(params: ForMeParams): Promise<Announcement[]> {
	const res = await apiClient.get<ApiResponse<Announcement[]>>(
		ANNOUNCEMENT_ROUTES.forMe,
		{ params },
	);
	return res.data.data ?? [];
}

export function useRelevantAnnouncements({
	role,
	userId,
	academicYearId,
}: UseRelevantAnnouncementsParams = {}) {
	const isPreceptor = role === ROLES.PRECEPTOR;
	const isTeacher = role === ROLES.TEACHER;

	const myCourses = useMyCourses({
		academicYearId,
		isPreceptor,
	});
	const teacherSubjects = useTeacherSubjects({
		teacherId: userId,
		academicYearId,
	});

	const contexts: RelevantContexts = useMemo(() => {
		const courses = isPreceptor ? (myCourses.data ?? []) : [];
		const subjectCourseIds = isTeacher
			? (teacherSubjects.data ?? [])
					.map((s) => s.courseId)
					.filter((id): id is string => Boolean(id))
			: [];
		if (!role) return { courseIds: [], levels: [] };
		return resolveContexts(role, courses, subjectCourseIds);
	}, [role, isPreceptor, isTeacher, myCourses.data, teacherSubjects.data]);

	const paramSets: ForMeParams[] = useMemo(() => {
		const sets: ForMeParams[] = [{}];
		for (const courseId of contexts.courseIds) sets.push({ courseId });
		for (const level of contexts.levels) sets.push({ level });
		return sets;
	}, [contexts]);

	const results = useQueries({
		queries: paramSets.map((params) => ({
			queryKey: [...queryKeys.announcements.forMe, params],
			queryFn: () => fetchForMe(params),
			staleTime: 1000 * 60 * 2,
			enabled: Boolean(role),
		})),
	});

	const announcements = useMemo(
		() => dedupeById(results.map((r) => r.data ?? [])),
		[results],
	);

	const isLoading =
		results.some((r) => r.isLoading) ||
		(isPreceptor && myCourses.isLoading) ||
		(isTeacher && teacherSubjects.isLoading);

	return { announcements, isLoading, contexts };
}
