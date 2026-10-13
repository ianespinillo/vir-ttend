/**
 * Central query-key factory. The same keys are used by the screens and by the
 * offline preload, so a screen opened without connection reads what the
 * preload cached. Keep this module free of React and of react-query imports.
 */
export const queryKeys = {
	activeAcademicYear: () => ['academic-year', 'active'] as const,
	preceptorDashboard: (date: string) => ['preceptor-dashboard', date] as const,
	preceptorCourses: (academicYearId: string) =>
		['courses', 'by-preceptor', academicYearId] as const,
	courseStudents: (courseId: string) =>
		['students', 'course', courseId] as const,
	dailyAttendance: (courseId: string, date: string) =>
		['attendance', 'daily', courseId, date] as const,
	/** Prefix of every history query of a course (any month). */
	courseHistoryPrefix: (courseId: string) =>
		['attendance', 'history', courseId] as const,
	courseHistory: (courseId: string, from: string, to: string) =>
		['attendance', 'history', courseId, from, to] as const,
	mySubjects: () => ['subjects', 'mine'] as const,
	subjectStudents: (subjectId: string) =>
		['subjects', subjectId, 'students'] as const,
	subjectAttendance: (subjectId: string, date: string) =>
		['attendance', 'subject', subjectId, date] as const,
} as const;
