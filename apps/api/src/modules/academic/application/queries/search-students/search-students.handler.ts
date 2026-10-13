import { Inject, Injectable } from '@nestjs/common';
import { PaginatedResponse } from '@repo/common';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { CourseService } from '../../../domain/services/course.service';
import { StudentDetailResponseDto } from '../../dtos/student-detail.response.dto';
import { SearchStudentsQuery } from './search-students.query';

@Injectable()
export class SearchStudentsHandler {
	constructor(
		@Inject('IStudentRepository')
		private readonly studentsRepo: IStudentRepository,
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
	) {}
	async execute(
		query: SearchStudentsQuery,
	): Promise<PaginatedResponse<StudentDetailResponseDto>> {
		const students = await this.studentsRepo.search(query);
		const courseIds = [
			...new Set(students.items.map((s) => s.courseId).filter(Boolean)),
		];
		const courseMap = new Map<string, string>();
		for (const courseId of courseIds) {
			const course = await this.courseRepo.findById(courseId);
			if (course) {
				courseMap.set(courseId, CourseService.calculateFulName(course));
			}
		}

		return {
			...students,
			items: students.items.map(
				(s) => new StudentDetailResponseDto(s, courseMap.get(s.courseId)),
			),
		};
	}
}
