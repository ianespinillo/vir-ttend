import { ApiProperty } from '@nestjs/swagger';
// preceptor-dashboard.response.dto.ts
import { CourseSnapshotDto } from './course-snapshot.dto';

export class PreceptorDashboardResponseDto {
	@ApiProperty({
		description: 'Fecha del dashboard consultado',
		example: '2026-03-10T13:00:00.000Z',
		type: Date,
		format: 'date-time',
	})
	date: Date;

	@ApiProperty({
		description: 'Resumen de asistencia de los cursos del preceptor',
		type: [CourseSnapshotDto],
	})
	courses: CourseSnapshotDto[];

	constructor(date: Date, courses: CourseSnapshotDto[]) {
		this.date = date;
		this.courses = courses;
	}
}
