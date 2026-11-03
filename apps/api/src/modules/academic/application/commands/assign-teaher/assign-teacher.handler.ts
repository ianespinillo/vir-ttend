import { Inject, Injectable } from '@nestjs/common';
import { ROLES } from '@repo/common';
import { DomainError, NotFoundError } from '../../../../../common/errors';
import { IMembershipPort } from '../../../domain/ports/membership.port.interface';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { IWorkshopCommissionRepository } from '../../../domain/repositories/workshop-commission.repository.interface';
import { assertCommissionsExist } from '../../services/subject-teacher-assignments';
import { AssignTeacherCommand } from './assign-teacher.command';

@Injectable()
export class AssignTeacherHandler {
	constructor(
		@Inject('ISubjectRepository')
		private readonly subjectRepo: ISubjectRepository,
		@Inject('IMembershipPort')
		private readonly memberRepo: IMembershipPort,
		@Inject('IWorkshopCommissionRepository')
		private readonly commissionRepo: IWorkshopCommissionRepository,
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
		const commissionNumber = command.commissionNumber ?? null;
		await assertCommissionsExist(this.commissionRepo, subject.courseId, [
			{ commissionNumber },
		]);
		subject.assignTeacher(command.teacherId, commissionNumber);
		await this.subjectRepo.save(subject);
	}
}
