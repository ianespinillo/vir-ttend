// dashboard-metrics.response.dto.ts
import { CourseSnapshotDto } from './course-snapshot.dto';

export class DashboardMetricsResponseDto {
	averageAttendance!: number;
	coursesAtRisk!: CourseSnapshotDto[];
	weeklyTrend!: { date: Date; percent: number }[];

	constructor(props: {
		averageAttendance: number;
		coursesAtRisk: CourseSnapshotDto[];
		weeklyTrend: { mondayWeek: Date; percent: number }[];
	}) {
		Object.assign(this, props);
	}
}
