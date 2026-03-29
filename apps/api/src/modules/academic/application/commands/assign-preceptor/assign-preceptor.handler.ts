import { Injectable } from '@nestjs/common';
import { ROLES } from '@repo/common';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IMembershipPort } from '../../ports/identity/membership.port.interface';
import { AssignPreceptorCommand } from './assign-preceptor.command';

@Injectable()
export class AssignPreceptorHandler {
	constructor(
		private readonly courseRepo: ICourseRepository,
		private readonly memberPort: IMembershipPort,
	) {}
	async execute(command: AssignPreceptorCommand) {
		const course = await this.courseRepo.findById(command.courseId);
		if (!course) throw new Error('Course not found');
		const belongs = await this.memberPort.belongsToTenant(
			command.preceptorId,
			course.tenantId,
		);
		if (!belongs) throw new Error("Preceptor doesn't belongs to tenant");
		const isPreceptor = await this.memberPort.existsAndHasRole(
			command.preceptorId,
			course.tenantId,
			ROLES.PRECEPTOR,
		);
		if (!isPreceptor) throw new Error('Invalid preceptor requested');
		course.assignPreceptor(command.preceptorId);
		await this.courseRepo.save(course);
	}
}
