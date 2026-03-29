import { Injectable } from '@nestjs/common';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { CourseResponseDto } from '../../dtos/course.response.dto';
import { GetCoursesQuery } from './get-courses.query';

@Injectable()
export class GetCoursesHandler {
	constructor(private readonly courseRepo: ICourseRepository) {}

	async execute(query: GetCoursesQuery): Promise<CourseResponseDto[]> {
		const courses = await this.courseRepo.findByAcademicYear(
			query.academicYearId,
			{ ...query },
		);
		return courses.map((c) => new CourseResponseDto(c));
	}
}
