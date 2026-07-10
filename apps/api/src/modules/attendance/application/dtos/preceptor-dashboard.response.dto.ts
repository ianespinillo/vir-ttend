// preceptor-dashboard.response.dto.ts
import { CourseSnapshotDto } from './course-snapshot.dto';

export class PreceptorDashboardResponseDto {
	date: Date;
	courses: CourseSnapshotDto[];

	constructor(date: Date, courses: CourseSnapshotDto[]) {
		this.date = date;
		this.courses = courses;
	}
}
