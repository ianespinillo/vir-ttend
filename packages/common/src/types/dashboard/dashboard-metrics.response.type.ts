import type { CourseSnapshot } from './course-snapshot.type.js';

export interface WeeklyTrendPoint {
	date: Date;
	percent: number;
}

export interface DashboardMetrics {
	averageAttendance: number;
	coursesAtRisk: CourseSnapshot[];
	weeklyTrend: WeeklyTrendPoint[];
}
