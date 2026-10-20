import { Inject, Injectable } from '@nestjs/common';
import { ROLES, STUDENTSTATUS } from '@repo/common';
import { ForbiddenError, NotFoundError } from '../../../../../common/errors';
import { Student } from '../../../domain/entities/student.entity';
import { Subject } from '../../../domain/entities/subject.entity';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IScheduleRepository } from '../../../domain/repositories/schedule.repository.interface';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { IWorkshopCommissionRepository } from '../../../domain/repositories/workshop-commission.repository.interface';
import { CourseService } from '../../../domain/services/course.service';
import { StudentResponseDto } from '../../dtos/student.response.dto';
import { GetSubjectStudentsQuery } from './get-subject-students.query';
import { resolveSubjectAudience, weekdayOf } from './subject-audience';

/**
 * Active roster of a subject: the whole course, or only the workshop
 * commission(s) its slots target (on the query date's weekday, or all of them
 * without a date). Teachers can only read the roster of their own subjects;
 * admins and preceptors can read any.
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
		@Inject('IScheduleRepository')
		private readonly scheduleRepo: IScheduleRepository,
		@Inject('IWorkshopCommissionRepository')
		private readonly commissionRepo: IWorkshopCommissionRepository,
	) {}

	async execute(query: GetSubjectStudentsQuery): Promise<StudentResponseDto[]> {
		const subject = await this.subjectRepo.findById(query.subjectId);
		if (!subject || subject.deletedAt) {
			throw new NotFoundError('Materia no encontrada');
		}
		const course = await this.courseRepo.findById(subject.courseId);
		if (!course || (query.tenantId && course.tenantId !== query.tenantId)) {
			throw new ForbiddenError('La materia no pertenece a su escuela.');
		}
		if (
			query.requesterRole === ROLES.TEACHER &&
			subject.teacherId !== query.requesterId
		) {
			throw new ForbiddenError('La materia no está asignada a este docente.');
		}

		const students = (await this.findRoster(subject, query.date))
			.filter(
				(s) => s.status === STUDENTSTATUS.ACTIVE && s.tenantId === query.tenantId,
			)
			.sort(
				(a, b) =>
					a.lastName.localeCompare(b.lastName) ||
					a.firstName.localeCompare(b.firstName),
			);

		const courseName = course
			? CourseService.calculateFulName(course)
			: undefined;
		return students.map((s) => new StudentResponseDto(s, courseName));
	}

	/** Students of the subject's audience; inactive ones are filtered by the caller. */
	private async findRoster(subject: Subject, date?: Date): Promise<Student[]> {
		const slots = await this.scheduleRepo.findBySubject(subject.id.getRaw());
		const audience = resolveSubjectAudience(
			slots,
			date ? weekdayOf(date) : undefined,
		);
		if (audience === 'whole-course')
			return this.studentRepo.findByCourse(subject.courseId);

		const commissions = await this.commissionRepo.findByCourse(subject.courseId);
		const commissionIds: string[] = [];
		for (const number of audience) {
			const commission = commissions.find((c) => c.number === number);
			if (!commission) return this.studentRepo.findByCourse(subject.courseId);
			commissionIds.push(commission.id);
		}
		const perCommission = await Promise.all(
			commissionIds.map((id) => this.studentRepo.findActiveByCommission(id)),
		);
		return perCommission.flat();
	}
}
