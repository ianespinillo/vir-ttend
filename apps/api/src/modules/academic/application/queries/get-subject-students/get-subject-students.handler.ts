import {
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { ROLES, STUDENTSTATUS } from '@repo/common';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { CourseService } from '../../../domain/services/course.service';
import { StudentResponseDto } from '../../dtos/student.response.dto';
import { GetSubjectStudentsQuery } from './get-subject-students.query';

/**
 * Active roster of the course a subject belongs to. Teachers can only read the
 * roster of their own subjects; admins and preceptors can read any.
 */
@Injectable()
export class GetSubjectStudentsHandler {
	constructor(
		@Inject('ISubjectRepository')
		private readonly subjectRepo: ISubjectRepository,
		@Inject('IStudentRepository')
		private readonly studentRepo: IStudentRepository,
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
	) {}

	async execute(query: GetSubjectStudentsQuery): Promise<StudentResponseDto[]> {
		const subject = await this.subjectRepo.findById(query.subjectId);
		if (!subject || subject.deletedAt) {
			throw new NotFoundException('Subject not found');
		}
		if (
			query.requesterRole === ROLES.TEACHER &&
			subject.teacherId !== query.requesterId
		) {
			throw new ForbiddenException('Subject does not belong to the teacher');
		}

		const students = (await this.studentRepo.findByCourse(subject.courseId))
			.filter(
				(s) => s.status === STUDENTSTATUS.ACTIVE && s.tenantId === query.tenantId,
			)
			.sort(
				(a, b) =>
					a.lastName.localeCompare(b.lastName) ||
					a.firstName.localeCompare(b.firstName),
			);

		const course = await this.courseRepo.findById(subject.courseId);
		const courseName = course
			? CourseService.calculateFulName(course)
			: undefined;
		return students.map((s) => new StudentResponseDto(s, courseName));
	}
}
