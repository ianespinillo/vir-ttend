import { Injectable } from '@nestjs/common';
import { Student } from '../../../domain/entities/student.entity';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { StudentDetailResponseDto } from '../../dtos/student-detail.response.dto';
import { GetStudentsByGradeQuery } from './get-students-by-grade.query';

@Injectable()
export class GetStudentsByGradeHandler {
	constructor(
		private readonly studentsRepo: IStudentRepository,
		private readonly courseRepo: ICourseRepository,
	) {}
	async execute({
		academicYearId,
		yearNumber,
		level,
	}: GetStudentsByGradeQuery): Promise<StudentDetailResponseDto[]> {
		const courses = await this.courseRepo.findByAcademicYear(
			academicYearId.getRaw(),
			{
				level,
			},
		);
		const filtered = courses.filter((course) => course.yearNumber === yearNumber);
		const students: Student[] = [];
		for (const course of filtered) {
			const courseStudents = await this.studentsRepo.findByCourse(
				course.id.getRaw(),
			);
			students.push(...courseStudents);
		}
		return students.map((student) => new StudentDetailResponseDto(student));
	}
}
