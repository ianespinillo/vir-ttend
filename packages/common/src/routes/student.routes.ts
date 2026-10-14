export const STUDENT_ROUTES = {
	students: '/students',
	student: (id: string) => `/students/${id}`,
	search: '/students/search',
	enroll: (id: string) => `/students/${id}/enroll`,
	transfer: (id: string) => `/students/${id}/transfer`,
	importTemplate: '/students/import/template',
	importPreview: '/students/import/preview',
	importCommit: '/students/import/commit',
} as const;
