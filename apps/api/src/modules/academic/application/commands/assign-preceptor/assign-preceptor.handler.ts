import { Inject, Injectable } from '@nestjs/common';
import { ROLES } from '@repo/common';
import { DomainError, NotFoundError } from '../../../../../common/errors';
import { IMembershipPort } from '../../../domain/ports/membership.port.interface';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { AssignPreceptorCommand } from './assign-preceptor.command';

@Injectable()
export class AssignPreceptorHandler {
	constructor(
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
		@Inject('IMembershipPort')
		private readonly memberPort: IMembershipPort,
	) {}
	async execute(command: AssignPreceptorCommand) {
		const course = await this.courseRepo.findById(command.courseId);
		if (!course) throw new NotFoundError('Curso no encontrado');
		const belongs = await this.memberPort.belongsToTenant(
			command.preceptorId,
			course.tenantId,
		);
		if (!belongs)
			throw new DomainError('El preceptor no pertenece a la escuela.');
		const isPreceptor = await this.memberPort.existsAndHasRole(
			command.preceptorId,
			course.tenantId,
			ROLES.PRECEPTOR,
		);
		if (!isPreceptor)
			throw new DomainError('El usuario indicado no es preceptor.');
		course.assignPreceptor(command.preceptorId);
		await this.courseRepo.save(course);
	}
}
