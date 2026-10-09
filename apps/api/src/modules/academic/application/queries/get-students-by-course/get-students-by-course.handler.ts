import { Inject, Injectable } from '@nestjs/common';
import { PaginatedResponse, STUDENTSTATUS } from '@repo/common';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { CourseService } from '../../../domain/services/course.service';
import { StudentResponseDto } from '../../dtos/student.response.dto';
import { GetStudentsByCourseQuery } from './get-students-by-course.query';

@Injectable()
export class GetStudentsByCourseHandler {
	constructor(
		@Inject('IStudentRepository')
		private readonly studentRepo: IStudentRepository,
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
	) {}
	async execute(
		query: GetStudentsByCourseQuery,
	): Promise<PaginatedResponse<StudentResponseDto>> {
		const { items, ...rest } = await this.studentRepo.search({
			tenantId: query.tenantId,
			query: query.search,
			courseId: query.courseId,
			status: query.status as STUDENTSTATUS,
			page: query.page,
			limit: query.limit,
		});

		const courseIds = [...new Set(items.map((s) => s.courseId).filter(Boolean))];
		const courseMap = new Map<string, string>();
		for (const courseId of courseIds) {
			const course = await this.courseRepo.findById(courseId);
			if (course) {
				courseMap.set(courseId, CourseService.calculateFulName(course));
			}
		}

		return {
			items: items.map(
				(s) => new StudentResponseDto(s, courseMap.get(s.courseId)),
			),
			...rest,
		};
	}
}
