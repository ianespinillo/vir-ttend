import { ICourseResponse, LevelType, ShiftType } from '@repo/common';
import { Course } from '../../domain/entities/course.entity';
import { CourseService } from '../../domain/services/course.service';

// course.response.dto.ts
export class CourseResponseDto implements ICourseResponse {
	id: string;
	level: LevelType;
	yearNumber: number;
	division: string;
	shift: ShiftType;
	preceptorId: string;
	fullName: string;

	constructor(course: Course) {
		this.id = course.id.getRaw();
		this.level = course.level;
		this.yearNumber = course.yearNumber;
		this.division = course.division;
		this.shift = course.shift;
		this.preceptorId = course.preceptorId;
		this.fullName = CourseService.calculateFulName(course);
	}
}
