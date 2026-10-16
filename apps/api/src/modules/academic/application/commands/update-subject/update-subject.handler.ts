import { Inject, Injectable } from '@nestjs/common';
import { SUBJECT_KIND } from '@repo/common';
import { BusinessRuleError, NotFoundError } from '../../../../../common/errors';
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
		if (command.teacherId) subject.assignTeacher(command.teacherId);
		subject.updateDetails(
			command.name,
			command.area,
			command.weeklyHours,
			command.kind,
		);
		await this.subjectRepo.save(subject);
	}
}
