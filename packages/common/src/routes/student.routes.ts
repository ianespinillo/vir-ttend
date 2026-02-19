export const STUDENT_ROUTES = {
	students: '/students',
	student: (id: string) => `/students/${id}`,
	search: '/students/search',
	enroll: (id: string) => `/students/${id}/enroll`,
	transfer: (id: string) => `/students/${id}/transfer`,
} as const;
