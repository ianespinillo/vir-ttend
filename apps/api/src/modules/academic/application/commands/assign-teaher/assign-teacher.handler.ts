import { Injectable } from '@nestjs/common';
import { ROLES } from '@repo/common';
import { IMembershipPort } from '../../../domain/ports/membership.port.interface';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { AssignTeacherCommand } from './assign-teacher.command';

@Injectable()
export class AssignTeacherHandler {
	constructor(
		private readonly subjectRepo: ISubjectRepository,
		private readonly memberRepo: IMembershipPort,
	) {}
	async execute(command: AssignTeacherCommand) {
		const subject = await this.subjectRepo.findById(command.subjectId);
		if (!subject) throw new Error('Subject not found');
		const belongs = await this.memberRepo.existsAndHasRole(
			command.teacherId,
			command.tenantId,
			ROLES.TEACHER,
		);
		if (!belongs) throw new Error('Invalid teacher selection');
		subject.assignTeacher(command.teacherId);
		await this.subjectRepo.save(subject);
	}
}
