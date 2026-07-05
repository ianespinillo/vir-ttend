import { Inject, Injectable } from '@nestjs/common';

import { ISubjectRepository } from '../../../academic/domain/repositories/subject.repository.interface';
import { Subject } from '../../domain/entities/subject.entity';
import { ISubjectPort } from '../../domain/ports/subject.port.interface';

@Injectable()
export class SubjectAdapter implements ISubjectPort {
	constructor(
		@Inject('ISubjectRepository')
		private readonly subjectRepository: ISubjectRepository,
	) {}

	async getSubjectById(subjectId: string): Promise<Subject | null> {
		const subject = await this.subjectRepository.findById(subjectId);
		if (!subject) return null;
		return Subject.reconstitute(
			subject.id.getRaw(),
			subject.courseId,
			subject.name,
		);
	}
	async getByTeacherAndCourses(
		teacherId: string,
		courses: string[],
	): Promise<Subject[]> {
		const subject = await this.subjectRepository.findByTeacherAndCourses(
			teacherId,
			courses,
		);
		return subject.map((s) =>
			Subject.reconstitute(s.id.getRaw(), s.courseId, s.name),
		);
	}
}
