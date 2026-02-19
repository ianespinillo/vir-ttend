export const ACADEMIC_ROUTES = {
	academicYears: '/academic-years',
	academicYear: (id: string) => `/academic-years/${id}`,
	courses: '/courses',
	course: (id: string) => `/courses/${id}`,
	coursePreceptor: (id: string) => `/courses/${id}/preceptor`,
	subjects: '/subjects',
	subject: (id: string) => `/subjects/${id}`,
	subjectTeacher: (id: string) => `/subjects/${id}/teacher`,
	schedule: '/schedule',
} as const;
