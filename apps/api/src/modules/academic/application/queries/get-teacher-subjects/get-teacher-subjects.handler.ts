import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../../identity/domain/repositories/user.repository.interface';
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
		@Inject('IUserRepository')
		private readonly userRepo: IUserRepository,
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

		const teacherIds = Array.from(
			new Set(
				subjects.map((s) => s.teacherId).filter((id): id is string => Boolean(id)),
			),
		);
		const teachers =
			teacherIds.length > 0 ? await this.userRepo.findByIds(teacherIds) : [];
		const teacherMap = new Map(teachers.map((t) => [t.id, t.fullName]));

		return subjects.map(
			(s) =>
				new SubjectResponseDto(
					s,
					s.teacherId ? teacherMap.get(s.teacherId) : undefined,
				),
		);
	}
}
