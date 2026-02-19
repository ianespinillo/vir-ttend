export const REPORT_ROUTES = {
	monthly: '/reports/monthly',
	generate: '/reports/generate',
	courseSummary: (courseId: string) => `/reports/course/${courseId}/summary`,
	available: (courseId: string) => `/reports/course/${courseId}/available`,
	byStudent: (studentId: string) => `/reports/student/${studentId}`,
	exportExcel: '/reports/export/excel',
	exportPdf: '/reports/export/pdf',
} as const;
