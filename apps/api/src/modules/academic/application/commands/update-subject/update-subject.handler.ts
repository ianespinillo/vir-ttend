import { Inject, Injectable } from '@nestjs/common';
import { SUBJECT_KIND } from '@repo/common';
import { BusinessRuleError, NotFoundError } from '../../../../../common/errors';
import { Subject } from '../../../domain/entities/subject.entity';
import { IMembershipPort } from '../../../domain/ports/membership.port.interface';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IScheduleRepository } from '../../../domain/repositories/schedule.repository.interface';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { IWorkshopCommissionRepository } from '../../../domain/repositories/workshop-commission.repository.interface';
import {
	assertCommissionsExist,
	assertTeachersBelongToTenant,
	requestedAssignments,
} from '../../services/subject-teacher-assignments';
import { UpdateSubjectCommand } from './update-subject.command';

@Injectable()
export class UpdateSubjectHandler {
	constructor(
		@Inject('ISubjectRepository')
		private readonly subjectRepo: ISubjectRepository,
		@Inject('IScheduleRepository')
		private readonly scheduleRepo: IScheduleRepository,
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
		@Inject('IMembershipPort')
		private readonly membershipPort: IMembershipPort,
		@Inject('IWorkshopCommissionRepository')
		private readonly commissionRepo: IWorkshopCommissionRepository,
	) {}
	async execute(command: UpdateSubjectCommand) {
		const subject = await this.subjectRepo.findById(command.subjectId);
		if (!subject) throw new NotFoundError('Materia no encontrada');
		if (
			command.kind === SUBJECT_KIND.THEORY &&
			subject.kind !== SUBJECT_KIND.THEORY
		) {
			const slots = await this.scheduleRepo.findBySubject(command.subjectId);
			if (slots.some((slot) => slot.commissionNumber !== null)) {
				throw new BusinessRuleError(
					'La materia tiene horarios asignados a una comisión; quite la comisión de esos horarios antes de cambiarla a teoría.',
				);
			}
		}
		const details = () =>
			subject.updateDetails(
				command.name,
				command.area,
				command.weeklyHours,
				command.kind,
			);
		// Teachers per commission need the workshop kind first; going back to
		// theory needs the teachers replaced first.
		if (command.kind === SUBJECT_KIND.WORKSHOP) {
			details();
			await this.applyTeacher(subject, command);
		} else {
			await this.applyTeacher(subject, command);
			details();
		}
		await this.subjectRepo.save(subject);
	}

	/**
	 * `teachers` replaces every assignment. Otherwise teacherId and
	 * teacherName both absent keep the current teachers; a real teacherId
	 * assigns that account to the whole subject; "NONE"/"" or a teacherName
	 * switch to the manual name, which unassigns the teacher when it is empty.
	 */
	private async applyTeacher(subject: Subject, command: UpdateSubjectCommand) {
		const { teacherId, teacherName, teachers } = command;
		if (
			teachers === undefined &&
			teacherId === undefined &&
			teacherName === undefined
		)
			return;
		const assignments = requestedAssignments(command);
		const teacherIds = assignments.flatMap((a) =>
			a.teacherId ? [a.teacherId] : [],
		);
		if (teacherIds.length > 0) {
			const course = await this.courseRepo.findById(subject.courseId);
			if (!course) throw new NotFoundError('Curso no encontrado');
			await assertTeachersBelongToTenant(
				this.membershipPort,
				teacherIds,
				course.tenantId,
			);
		}
		await assertCommissionsExist(
			this.commissionRepo,
			subject.courseId,
			assignments,
		);
		subject.replaceTeachers(assignments);
	}
}
