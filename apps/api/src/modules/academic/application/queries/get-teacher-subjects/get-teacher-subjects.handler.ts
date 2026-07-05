import { Injectable, NotFoundException } from '@nestjs/common';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { SubjectResponseDto } from '../../dtos/subject.response.dto';
import { GetTeacherSubjectsQuery } from './get-teacher-subjects.query';

@Injectable()
export class GetTeacherSubjectsQueryHandler {
	constructor(
		private readonly courseRepo: ICourseRepository,
		private readonly subjectRepo: ISubjectRepository,
	) {}
	async execute(query: GetTeacherSubjectsQuery): Promise<SubjectResponseDto[]> {
		const courses = await this.courseRepo.findByAcademicYear(
			query.academicYearId,
		);
		if (courses.length === 0) throw new NotFoundException('Courses not founded');
		const subjects = await this.subjectRepo.findByTeacherAndCourses(
			query.teacherId,
			courses.map((c) => c.id.getRaw()),
		);
		return subjects.map((s) => new SubjectResponseDto(s));
	}
}
