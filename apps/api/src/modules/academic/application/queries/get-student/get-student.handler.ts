import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { CourseService } from '../../../domain/services/course.service';
import { StudentDetailResponseDto } from '../../dtos/student-detail.response.dto';
import { GetStudentQuery } from './get-student.query';

@Injectable()
export class GetStudentHandler {
	constructor(
		@Inject('IStudentRepository')
		private readonly studentRepo: IStudentRepository,
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
	) {}
	async execute(query: GetStudentQuery): Promise<StudentDetailResponseDto> {
		const student = await this.studentRepo.findById(query.id);
		if (!student) {
			throw new NotFoundException('Student not found');
		}
		const course = student.courseId
			? await this.courseRepo.findById(student.courseId)
			: null;
		const courseName = course
			? CourseService.calculateFulName(course)
			: undefined;
		return new StudentDetailResponseDto(student, courseName);
	}
}
