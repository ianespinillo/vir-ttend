import { Inject, Injectable } from '@nestjs/common';
import { PaginatedResponse } from '@repo/common';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserWithMembershipResponseDto } from '../../dto/user-with-membership.response.dto';
import { ListUsersByTenantQuery } from './list-users-by-tenant.query';

@Injectable()
export class ListUsersByTenantHandler {
	constructor(
		@Inject('IUserTenantMembershipRepository')
		private readonly memberRepo: IUserTenantMembershipRepository,
		@Inject('IUserRepository')
		private readonly userRepo: IUserRepository,
	) {}
	async execute(
		command: ListUsersByTenantQuery,
	): Promise<PaginatedResponse<UserWithMembershipResponseDto>> {
		const entities = await this.memberRepo.findByTenant(command.tenantId, {
			page: command.page,
			limit: command.limit,
			role: command.role ?? undefined,
		});
		const memberships: UserWithMembershipResponseDto[] = [];
		for (const uT of entities.items) {
			const user = await this.userRepo.findById(uT.userId);
			if (!user) continue;
			memberships.push(
				new UserWithMembershipResponseDto(
					user.id,
					user.email,
					user.firstName,
					user.lastName,
					uT.role,
					uT.isActive,
					user.mustChangePassword,
				),
			);
		}
		return {
			total: entities.total,
			items: memberships,
			limit: command.limit,
			page: command.page,
			totalPages: Math.round(entities.total / command.limit),
		};
	}
}
