export const ACADEMIC_ROUTES = {
	academicYears: '/academic-years',
	academicYear: (id: string) => `/academic-years/${id}`,
	academicYearNonWorkingDays: (id: string) =>
		`/academic-years/${id}/non-working-days`,
	courses: '/courses',
	coursesByPreceptor: '/courses/by-preceptor',
	course: (id: string) => `/courses/${id}`,
	coursePreceptor: (id: string) => `/courses/${id}/preceptor`,
	subjects: '/subjects',
	subject: (id: string) => `/subjects/${id}`,
	subjectTeacher: (id: string) => `/subjects/${id}/teacher`,
	schedule: '/schedule',
	workshopCommissions: (courseId: string) =>
		`/courses/${courseId}/workshop-commissions`,
	workshopCommissionsRegenerate: (courseId: string) =>
		`/courses/${courseId}/workshop-commissions/regenerate`,
	workshopCommissionPreceptor: (id: string) =>
		`/workshop-commissions/${id}/preceptor`,
	workshopCommissionStudent: (id: string, studentId: string) =>
		`/workshop-commissions/${id}/students/${studentId}`,
} as const;
