import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../../identity/domain/repositories/user.repository.interface';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { CourseResponseDto } from '../../dtos/course.response.dto';
import { GetCoursesQuery } from './get-courses.query';
@Injectable()
export class GetCoursesHandler {
	constructor(
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
		@Inject('IUserRepository')
		private readonly userRepo: IUserRepository,
	) {}

	async execute(query: GetCoursesQuery): Promise<CourseResponseDto[]> {
		const courses = await this.courseRepo.findByAcademicYear(
			query.academicYearId,
			{ ...query },
		);
		const extendedCourses: CourseResponseDto[] = [];
		for (const course of courses) {
			const preceptor = course.preceptorId
				? await this.userRepo.findById(course.preceptorId)
				: null;
			extendedCourses.push(
				new CourseResponseDto(course, preceptor?.fullName ?? 'Sin asignar'),
			);
		}
		return extendedCourses;
	}
}
