import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
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
			throw new NotFoundException(
				`User with email ${command.userEmail} not found`,
			);
		const tenant = await this.tenantRepository.findById(command.tenantId);
		if (!tenant)
			throw new NotFoundException(`Tenant with id ${command.tenantId} not found`);
		const existentRelation = await this.memberRepo.findByUserAndTenant(
			user.id,
			command.tenantId,
		);
		if (existentRelation)
			throw new BadRequestException(
				`User with email ${command.userEmail} is already a member of this tenant`,
			);
		await this.memberRepo.save(
			UserTenantMembership.create(user.id, command.tenantId, command.role),
		);
	}
}
