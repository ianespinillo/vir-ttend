import { Injectable } from '@nestjs/common';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { CourseResponseDto } from '../../dtos/course.response.dto';
import { GetCoursesByPreceptorQuery } from './get-courses-by-preceptor.query';

@Injectable()
export class GetCoursesByPreceptorHandler {
	constructor(private readonly courseRepo: ICourseRepository) {}
	async execute(
		query: GetCoursesByPreceptorQuery,
	): Promise<CourseResponseDto[]> {
		const courses = await this.courseRepo.findByAcademicYear(
			query.academicYearId,
			{ ...query },
		);
		return courses.map((c) => new CourseResponseDto(c));
	}
}
