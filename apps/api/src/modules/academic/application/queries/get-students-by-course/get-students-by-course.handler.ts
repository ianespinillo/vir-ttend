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
		let scopedCourseIds: string[] | undefined;

		if (query.preceptorId) {
			const preceptorCourses = await this.courseRepo.findByPreceptor(
				query.preceptorId,
			);
			const allowedCourseIds = preceptorCourses.map((c) => c.id.getRaw());

			if (query.courseId) {
				if (!allowedCourseIds.includes(query.courseId)) {
					return {
						items: [],
						total: 0,
						page: query.page,
						limit: query.limit,
						totalPages: 0,
					};
				}
				scopedCourseIds = [query.courseId];
			} else {
				if (allowedCourseIds.length === 0) {
					return {
						items: [],
						total: 0,
						page: query.page,
						limit: query.limit,
						totalPages: 0,
					};
				}
				scopedCourseIds = allowedCourseIds;
			}
		}

		const { items, ...rest } = await this.studentRepo.search({
			tenantId: query.tenantId,
			query: query.search,
			courseId: query.preceptorId ? undefined : query.courseId,
			courseIds: scopedCourseIds,
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
