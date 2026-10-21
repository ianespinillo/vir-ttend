import {
	BadRequestException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { ROLES } from '@repo/common';
import { IMembershipPort } from '../../../domain/ports/membership.port.interface';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IWorkshopCommissionRepository } from '../../../domain/repositories/workshop-commission.repository.interface';
import { assertCanManageCommissions } from '../../services/commission-access';
import { AssignWorkshopPreceptorCommand } from './assign-workshop-preceptor.command';

@Injectable()
export class AssignWorkshopPreceptorHandler {
	constructor(
		@Inject('IWorkshopCommissionRepository')
		private readonly commissionRepo: IWorkshopCommissionRepository,
		@Inject('IMembershipPort')
		private readonly memberPort: IMembershipPort,
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
	) {}

	async execute(command: AssignWorkshopPreceptorCommand): Promise<void> {
		const commission = await this.commissionRepo.findById(command.commissionId);
		if (!commission || commission.tenantId !== command.tenantId)
			throw new NotFoundException('Comisión no encontrada');
		if (command.actorRole === ROLES.PRECEPTOR) {
			const course = await this.courseRepo.findById(commission.courseId);
			if (!course || course.tenantId !== command.tenantId)
				throw new NotFoundException('Curso no encontrado');
			assertCanManageCommissions(course, command.actorId, command.actorRole);
		}

		if (command.preceptorId !== null) {
			const belongs = await this.memberPort.belongsToTenant(
				command.preceptorId,
				commission.tenantId,
			);
			if (!belongs)
				throw new BadRequestException('El preceptor no pertenece a la escuela.');
			const isPreceptor = await this.memberPort.existsAndHasRole(
				command.preceptorId,
				commission.tenantId,
				ROLES.PRECEPTOR,
			);
			if (!isPreceptor)
				throw new BadRequestException('El usuario indicado no es preceptor.');
		}
		commission.assignPreceptor(command.preceptorId);
		await this.commissionRepo.save(commission);
	}
}
