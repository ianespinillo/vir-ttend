import { ApiProperty } from '@nestjs/swagger';
// dashboard-metrics.response.dto.ts
import { CourseSnapshotDto } from './course-snapshot.dto';

export class DashboardMetricsResponseDto {
	@ApiProperty({
		description:
			'Promedio de asistencia de los cursos del preceptor en el año académico',
		example: 84.5,
		minimum: 0,
		maximum: 100,
	})
	averageAttendance!: number;

	@ApiProperty({
		description: 'Resúmenes de los cursos que superan los umbrales de riesgo',
		type: [CourseSnapshotDto],
	})
	coursesAtRisk!: CourseSnapshotDto[];

	@ApiProperty({
		description: 'Tendencia semanal del porcentaje de asistencia',
		type: 'array',
		example: [
			{ date: '2026-03-10T00:00:00.000Z', percent: 82 },
			{ date: '2026-03-11T00:00:00.000Z', percent: 87 },
		],
	})
	weeklyTrend!: { date: Date; percent: number }[];

	constructor(props: {
		averageAttendance: number;
		coursesAtRisk: CourseSnapshotDto[];
		weeklyTrend: { mondayWeek: Date; percent: number }[];
	}) {
		Object.assign(this, props);
	}
}
