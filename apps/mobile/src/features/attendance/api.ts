import axios, { type AxiosResponse } from 'axios';
import { api } from '../../services/api';
import type { JustifyPayload } from './justification';
import type {
	AcademicYear,
	AttendanceRecordItem,
	CourseSnapshot,
	DailyAttendance,
	MySubject,
	MyWorkshopCommission,
	PreceptorCourse,
	StudentItem,
	SubjectAttendance,
	WorkshopAttendance,
} from './types';
import { mapWorkshopAttendance } from './workshop';

// Roster page size used by the daily screen since the first version.
const STUDENTS_PAGE_LIMIT = 100;

/** Removes the `{ success, data, timeStamp }` envelope when present. */
const unwrap = <T>(response: AxiosResponse): T =>
	(response.data?.data ?? response.data) as T;

const asArray = <T>(payload: unknown): T[] => {
	if (Array.isArray(payload)) return payload as T[];
	const items = (payload as { items?: unknown } | null | undefined)?.items;
	return Array.isArray(items) ? (items as T[]) : [];
};

const isNotFound = (error: unknown): boolean =>
	axios.isAxiosError(error) && error.response?.status === 404;

export const fetchActiveAcademicYear = async (): Promise<AcademicYear> =>
	unwrap<AcademicYear>(await api.get('/academic-years/active'));

export const fetchPreceptorDashboard = async (
	date: string,
): Promise<CourseSnapshot[]> => {
	const payload = unwrap<{ courses?: CourseSnapshot[] } | null>(
		await api.get('/dashboard', { params: { date } }),
	);
	return payload?.courses ?? [];
};

export const fetchPreceptorCourses = async (
	academicYearId: string,
): Promise<PreceptorCourse[]> =>
	asArray<PreceptorCourse>(
		unwrap(
			await api.get('/courses/by-preceptor', { params: { academicYearId } }),
		),
	);

export const fetchCourseStudents = async (
	courseId: string,
): Promise<StudentItem[]> =>
	asArray<StudentItem>(
		unwrap(
			await api.get('/students', {
				params: { courseId, limit: STUDENTS_PAGE_LIMIT },
			}),
		),
	);

/**
 * Only a 404 (nothing registered) becomes an empty roster. Any other failure
 * must reject: a swallowed network error would be cached as a successful
 * empty result and overwrite good offline data.
 */
export const fetchDailyAttendance = async (
	courseId: string,
	date: string,
): Promise<DailyAttendance> => {
	try {
		// `GET /attendance/daily` returns the roster as a bare array (the web hook
		// reads it the same way). A `{ records }` object is tolerated defensively.
		const payload = unwrap<
			AttendanceRecordItem[] | Partial<DailyAttendance> | null
		>(await api.get('/attendance/daily', { params: { courseId, date } }));
		const records = Array.isArray(payload) ? payload : (payload?.records ?? []);
		return { courseId, date, records };
	} catch (error) {
		if (isNotFound(error)) return { courseId, date, records: [] };
		throw error;
	}
};

/**
 * Every record of a course between two dates, with the justification embedded
 * on justified ones (same endpoint the web "review justifications" modal uses;
 * preceptor/admin only).
 */
export const fetchCourseHistory = async (
	courseId: string,
	from: string,
	to: string,
): Promise<AttendanceRecordItem[]> =>
	asArray<AttendanceRecordItem>(
		unwrap(
			await api.get('/attendance/history', { params: { courseId, from, to } }),
		),
	);

/** Justifies an absent record. Not idempotent: never queue or retry blindly. */
export const justifyAttendance = async (
	recordId: string,
	payload: JustifyPayload,
): Promise<void> => {
	await api.post(`/attendance/${recordId}/justify`, payload);
};

/** Commissions the user is the workshop preceptor of (all of them for an admin). */
export const fetchMyWorkshopCommissions = async (
	date: string,
): Promise<MyWorkshopCommission[]> =>
	asArray<MyWorkshopCommission>(
		unwrap(
			await api.get('/attendance/workshop/my-commissions', { params: { date } }),
		),
	);

/**
 * The commission's roster with the day's workshop statuses. Unlike daily
 * attendance there is no separate roster query: the roster comes with it.
 */
export const fetchWorkshopAttendance = async (
	commissionId: string,
	date: string,
): Promise<WorkshopAttendance> =>
	mapWorkshopAttendance(
		commissionId,
		date,
		unwrap(
			await api.get('/attendance/workshop', { params: { commissionId, date } }),
		),
	);

export const fetchMySubjects = async (): Promise<MySubject[]> =>
	asArray<MySubject>(unwrap(await api.get('/subjects/mine')));

export const fetchSubjectStudents = async (
	subjectId: string,
): Promise<StudentItem[]> =>
	asArray<StudentItem>(unwrap(await api.get(`/subjects/${subjectId}/students`)));

export const fetchSubjectAttendance = async (
	subjectId: string,
	date: string,
): Promise<SubjectAttendance> => {
	const payload = unwrap<Partial<SubjectAttendance> | null>(
		await api.get('/attendance/subject', { params: { subjectId, date } }),
	);
	return {
		subjectId,
		subjectName: payload?.subjectName ?? '',
		courseId: payload?.courseId ?? '',
		date,
		records: payload?.records ?? [],
	};
};
