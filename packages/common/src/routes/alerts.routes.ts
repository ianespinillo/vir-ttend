export const ALERT_ROUTES = {
	alerts: '/alerts',
	unseen: '/alerts/unseen',
	count: '/alerts/count',
	seen: (id: string) => `/alerts/${id}/seen`,
	generate: '/alerts/generate',
	byStudent: (studentId: string) => `/alerts/student/${studentId}`,
} as const;
