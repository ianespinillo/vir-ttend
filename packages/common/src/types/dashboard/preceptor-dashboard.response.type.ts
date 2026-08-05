import type { CourseSnapshot } from './course-snapshot.type.js';

export interface PreceptorDashboard {
	date: Date;
	courses: CourseSnapshot[];
}
