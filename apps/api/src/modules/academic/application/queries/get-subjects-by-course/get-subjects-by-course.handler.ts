import { Injectable } from '@nestjs/common';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { SubjectResponseDto } from '../../dtos/subject.response.dto';
import { GetSubjectsByCourseQuery } from './get-subjects-by-course.query';

@Injectable()
export class GetSubjectsByCourseHandler {
	constructor(private readonly subjectRepo: ISubjectRepository) {}
	async execute(query: GetSubjectsByCourseQuery): Promise<SubjectResponseDto[]> {
		const subjects = await this.subjectRepo.findByCourse(query.courseId);
		return subjects.map((c) => new SubjectResponseDto(c));
	}
}
