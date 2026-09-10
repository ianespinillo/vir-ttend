import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { SubjectResponseDto } from '../../dtos/subject.response.dto';
import { GetTeacherSubjectsQuery } from './get-teacher-subjects.query';

@Injectable()
export class GetTeacherSubjectsQueryHandler {
	constructor(
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
		@Inject('ISubjectRepository')
		private readonly subjectRepo: ISubjectRepository,
	) {}
	async execute(query: GetTeacherSubjectsQuery): Promise<SubjectResponseDto[]> {
		const courses = await this.courseRepo.findByAcademicYear(
			query.academicYearId,
		);
		if (courses.length === 0) return [];
		const courseIds = courses.map((c) => c.id.getRaw());
		const subjects = query.teacherId
			? await this.subjectRepo.findByTeacherAndCourses(query.teacherId, courseIds)
			: await this.subjectRepo.findByCourses(courseIds);
		return subjects.map((s) => new SubjectResponseDto(s));
	}
}
