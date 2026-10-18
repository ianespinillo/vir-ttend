import { Inject, Injectable } from '@nestjs/common';
import { ROLES } from '@repo/common';
import { DomainError, NotFoundError } from '../../../../../common/errors';
import { IMembershipPort } from '../../../domain/ports/membership.port.interface';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { AssignTeacherCommand } from './assign-teacher.command';

@Injectable()
export class AssignTeacherHandler {
	constructor(
		@Inject('ISubjectRepository')
		private readonly subjectRepo: ISubjectRepository,
		@Inject('IMembershipPort')
		private readonly memberRepo: IMembershipPort,
	) {}
	async execute(command: AssignTeacherCommand) {
		const subject = await this.subjectRepo.findById(command.subjectId);
		if (!subject) throw new NotFoundError('Materia no encontrada');
		const belongs = await this.memberRepo.existsAndHasRole(
			command.teacherId,
			command.tenantId,
			ROLES.TEACHER,
		);
		if (!belongs)
			throw new DomainError('El usuario indicado no es docente de la escuela.');
		subject.assignTeacher(command.teacherId);
		await this.subjectRepo.save(subject);
	}
}
