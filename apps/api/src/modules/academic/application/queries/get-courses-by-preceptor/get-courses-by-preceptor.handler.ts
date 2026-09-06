import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../../identity/domain/repositories/user.repository.interface';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { CourseResponseDto } from '../../dtos/course.response.dto';
import { GetCoursesByPreceptorQuery } from './get-courses-by-preceptor.query';

@Injectable()
export class GetCoursesByPreceptorHandler {
	constructor(
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
		@Inject('IUserRepository')
		private readonly userRepo: IUserRepository,
	) {}
	async execute(
		query: GetCoursesByPreceptorQuery,
	): Promise<CourseResponseDto[]> {
		const courses = await this.courseRepo.findByAcademicYear(
			query.academicYearId,
			{ ...query },
		);
		const preceptor = await this.userRepo.findById(query.preceptorId);
		return courses.map((c) => new CourseResponseDto(c, preceptor.fullName));
	}
}
