import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../../identity/domain/repositories/user.repository.interface';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { SubjectResponseDto } from '../../dtos/subject.response.dto';
import { loadTeacherNames } from '../load-teacher-names';
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
		const teacherMap = await loadTeacherNames(this.userRepo, subjects);

		return subjects.map((s) => new SubjectResponseDto(s, teacherMap));
	}
}
