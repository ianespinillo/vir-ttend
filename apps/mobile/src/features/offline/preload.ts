import type {
	FetchQueryOptions,
	QueryClient,
	QueryKey,
} from '@tanstack/react-query';
import { toLocalDateString, weekdayOf } from '../../lib/date';
import { resolveCourseList } from '../attendance/course-list';
import { attendanceQueries } from '../attendance/queries';
import { hasClassOnWeekday } from '../attendance/schedule';

export type PreloadRole = 'preceptor' | 'teacher';

export const PRELOAD_CONCURRENCY = 3;

/** Roles the mobile app preloads for; anything else has nothing to preload. */
export const preloadRoleOf = (role: string | undefined): PreloadRole | null => {
	switch (role?.toLowerCase()) {
		case 'preceptor':
		case 'admin':
			return 'preceptor';
		case 'teacher':
			return 'teacher';
		default:
			return null;
	}
};

/**
 * Runs the tasks with at most `limit` in flight. Never rejects: tasks are
 * expected to handle their own errors.
 */
export const runWithConcurrency = async (
	tasks: ReadonlyArray<() => Promise<unknown>>,
	limit: number,
): Promise<void> => {
	let next = 0;
	const worker = async (): Promise<void> => {
		while (next < tasks.length) {
			const index = next++;
			try {
				await tasks[index]();
			} catch {
				// The task owns its error handling; keep the pool going.
			}
		}
	};
	const workers = Array.from(
		{ length: Math.max(1, Math.min(limit, tasks.length)) },
		worker,
	);
	await Promise.all(workers);
};

export interface PreloadParams {
	queryClient: QueryClient;
	role: PreloadRole;
	now: Date;
	concurrency?: number;
	isCancelled?: () => boolean;
}

export interface PreloadResult {
	/** Requests attempted. */
	total: number;
	failed: number;
	cancelled: boolean;
}

/**
 * Fetches everything the role needs to work offline into the query cache,
 * under the same keys the screens read. Never throws.
 *
 * - preceptor: dashboard (or active year + assigned courses) -> per course:
 *   students + today's daily attendance; then its workshop commissions ->
 *   per commission: today's workshop roster.
 * - teacher: `subjects/mine` -> per subject: students, plus today's subject
 *   attendance only for subjects with a class today (device local weekday).
 */
export const runPreload = async ({
	queryClient,
	role,
	now,
	concurrency = PRELOAD_CONCURRENCY,
	isCancelled = () => false,
}: PreloadParams): Promise<PreloadResult> => {
	const result: PreloadResult = { total: 0, failed: 0, cancelled: false };
	const today = toLocalDateString(now);
	const weekday = weekdayOf(now);

	// `staleTime: 0` forces a refresh. `networkMode: 'always'` makes a dropped
	// connection fail fast (axios timeout) instead of pausing forever.
	const load = async <TData, TKey extends QueryKey>(
		options: FetchQueryOptions<TData, Error, TData, TKey>,
	): Promise<TData | undefined> => {
		if (isCancelled()) {
			result.cancelled = true;
			return undefined;
		}
		result.total++;
		try {
			return await queryClient.fetchQuery({
				...options,
				staleTime: 0,
				retry: 1,
				retryDelay: 1000,
				networkMode: 'always',
			});
		} catch {
			result.failed++;
			return undefined;
		}
	};

	const taskThunks: Array<() => Promise<unknown>> = [];

	if (role === 'preceptor') {
		const dashboard = await load(attendanceQueries.preceptorDashboard(today));
		let courses = resolveCourseList(dashboard, undefined);
		if (courses.length === 0) {
			const year = await load(attendanceQueries.activeAcademicYear());
			if (year) {
				const assigned = await load(attendanceQueries.preceptorCourses(year.id));
				courses = resolveCourseList(undefined, assigned);
			}
		}
		for (const course of courses) {
			taskThunks.push(
				() => load(attendanceQueries.courseStudents(course.courseId)),
				() => load(attendanceQueries.dailyAttendance(course.courseId, today)),
			);
		}
		// Workshop commissions (technical schools): list + today's roster each.
		const commissions =
			(await load(attendanceQueries.myWorkshopCommissions(today))) ?? [];
		for (const commission of commissions) {
			taskThunks.push(() =>
				load(attendanceQueries.workshopAttendance(commission.commissionId, today)),
			);
		}
	} else {
		const subjects = (await load(attendanceQueries.mySubjects())) ?? [];
		for (const subject of subjects) {
			taskThunks.push(() =>
				load(attendanceQueries.subjectStudents(subject.subjectId)),
			);
			if (hasClassOnWeekday(subject, weekday)) {
				taskThunks.push(() =>
					load(attendanceQueries.subjectAttendance(subject.subjectId, today)),
				);
			}
		}
	}

	await runWithConcurrency(taskThunks, concurrency);
	result.cancelled = result.cancelled || isCancelled();
	return result;
};
