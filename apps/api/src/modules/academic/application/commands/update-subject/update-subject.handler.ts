import { Inject, Injectable } from '@nestjs/common';
import { SUBJECT_KIND } from '@repo/common';
import {
	BusinessRuleError,
	DomainError,
	NotFoundError,
} from '../../../../../common/errors';
import { Subject } from '../../../domain/entities/subject.entity';
import { IMembershipPort } from '../../../domain/ports/membership.port.interface';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IScheduleRepository } from '../../../domain/repositories/schedule.repository.interface';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
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
		await this.applyTeacher(subject, command);
		subject.updateDetails(
			command.name,
			command.area,
			command.weeklyHours,
			command.kind,
		);
		await this.subjectRepo.save(subject);
	}

	/**
	 * teacherId and teacherName both absent keep the current teacher. A real
	 * teacherId assigns that account; "NONE"/"" or a teacherName switch to the
	 * manual name, which unassigns the teacher when it is empty.
	 */
	private async applyTeacher(subject: Subject, command: UpdateSubjectCommand) {
		const { teacherId, teacherName } = command;
		if (teacherId && teacherId !== 'NONE') {
			const course = await this.courseRepo.findById(subject.courseId);
			if (!course) throw new NotFoundError('Curso no encontrado');
			const belongs = await this.membershipPort.belongsToTenant(
				teacherId,
				course.tenantId,
			);
			if (!belongs)
				throw new DomainError('El profesor no pertenece a la institución.');
			subject.assignTeacher(teacherId);
			return;
		}
		if (teacherId === undefined && teacherName === undefined) return;
		subject.assignExternalTeacher(teacherName ?? '');
	}
}
