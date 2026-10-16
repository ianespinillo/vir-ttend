import { Inject } from '@nestjs/common';
import { ConflictError, NotFoundError } from '../../../../../common/errors';
import { UserTenantMembership } from '../../../domain/entities/user-tenant-membership.entity';
import { ITenantRepository } from '../../../domain/repositories/tenant.repository.interface';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { CreateMembershipCommand } from './create-membership.command';

export class CreateMembershipHandler {
	constructor(
		@Inject('IUserRepository')
		private readonly userRepository: IUserRepository,
		@Inject('IUserTenantMembershipRepository')
		private readonly memberRepo: IUserTenantMembershipRepository,
		@Inject('ITenantRepository')
		private readonly tenantRepository: ITenantRepository,
	) {}
	async execute(command: CreateMembershipCommand): Promise<void> {
		const user = await this.userRepository.findByEmail(command.userEmail);
		if (!user)
			throw new NotFoundError(
				`No existe un usuario con el correo ${command.userEmail}.`,
			);
		const tenant = await this.tenantRepository.findById(command.tenantId);
		if (!tenant) throw new NotFoundError('Institución no encontrada.');
		const existentRelation = await this.memberRepo.findByUserAndTenant(
			user.id,
			command.tenantId,
		);
		if (existentRelation)
			throw new ConflictError(
				`El usuario ${command.userEmail} ya pertenece a esta institución.`,
			);
		await this.memberRepo.save(
			UserTenantMembership.create(user.id, command.tenantId, command.role),
		);
	}
}
