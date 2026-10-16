import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../../identity/domain/repositories/user.repository.interface';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { SubjectResponseDto } from '../../dtos/subject.response.dto';
import { GetSubjectsByCourseQuery } from './get-subjects-by-course.query';

@Injectable()
export class GetSubjectsByCourseHandler {
	constructor(
		@Inject('ISubjectRepository')
		private readonly subjectRepo: ISubjectRepository,
		@Inject('IUserRepository')
		private readonly userRepo: IUserRepository,
	) {}
	async execute(query: GetSubjectsByCourseQuery): Promise<SubjectResponseDto[]> {
		const subjects = await this.subjectRepo.findByCourse(query.courseId);
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
