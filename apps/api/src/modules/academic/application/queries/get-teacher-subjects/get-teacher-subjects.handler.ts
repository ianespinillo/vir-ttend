import { Inject, Injectable } from '@nestjs/common';
import { hasSubjectAttendance } from '@repo/common';
import { IUserRepository } from '../../../../identity/domain/repositories/user.repository.interface';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { SubjectResponseDto } from '../../dtos/subject.response.dto';
import { loadTeacherNames } from '../load-teacher-names';
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
		const courseById = new Map(courses.map((c) => [c.id.getRaw(), c]));
		const courseIds = courses.map((c) => c.id.getRaw());
		const subjects = query.teacherId
			? await this.subjectRepo.findByTeacherAndCourses(query.teacherId, courseIds)
			: await this.subjectRepo.findByCourses(courseIds);

		const teacherMap = await loadTeacherNames(this.userRepo, subjects);

		return subjects.map((s) => {
			const course = courseById.get(s.courseId);
			return new SubjectResponseDto(
				s,
				teacherMap,
				course ? hasSubjectAttendance({ kind: s.kind, course }) : true,
			);
		});
	}
}
