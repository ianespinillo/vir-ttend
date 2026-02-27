import { Injectable } from '@nestjs/common';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserWithMembershipResponseDto } from '../../dto/user-with-membership.response.dto';
import { ListUsersByTenantQuery } from './list-users-by-tenant.query';

@Injectable()
export class ListUsersByTenantHandler {
	constructor(
		private readonly memberRepo: IUserTenantMembershipRepository,
		private readonly userRepo: IUserRepository,
	) {}
	async execute(
		command: ListUsersByTenantQuery,
	): Promise<{ total: number; items: UserWithMembershipResponseDto[] }> {
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
		};
	}
}
