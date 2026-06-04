import { Injectable } from '@nestjs/common';
import { PaginatedResponse, STUDENTSTATUS } from '@repo/common';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { StudentDetailResponseDto } from '../../dtos/student-detail.response.dto';
import { GetStudentsByCourseQuery } from './get-students-by-course.query';

@Injectable()
export class GetStudentsByCourseHandler {
	constructor(private readonly studentRepo: IStudentRepository) {}
	async execute(
		query: GetStudentsByCourseQuery,
	): Promise<PaginatedResponse<StudentDetailResponseDto>> {
		const { items, ...rest } = await this.studentRepo.search({
			...query,
			status: query.status as STUDENTSTATUS,
			courseId: query.courseId,
			tenantId: query.tenantId,
		});
		return {
			items: items.map((s) => new StudentDetailResponseDto(s)),
			...rest,
		};
	}
}
