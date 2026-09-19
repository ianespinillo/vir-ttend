import { Inject, Injectable } from '@nestjs/common';
import { PaginatedResponse, ROLES, type Roles } from '@repo/common';
import { ITenantRepository } from '../../../domain/repositories/tenant.repository.interface';
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
		@Inject('ITenantRepository')
		private readonly tenantRepo: ITenantRepository,
	) {}

	async execute(
		command: ListUsersByTenantQuery,
	): Promise<PaginatedResponse<UserWithMembershipResponseDto>> {
		if (command.tenantId) {
			const tenant = await this.tenantRepo.findById(command.tenantId);
			const entities = await this.memberRepo.findByTenant(command.tenantId, {
				page: command.page,
				limit: command.limit,
				role: command.role ?? undefined,
			});

			const memberships: UserWithMembershipResponseDto[] = [];
			for (const uT of entities.items) {
				const user = await this.userRepo.findById(uT.userId);
				if (!user) continue;

				if (command.search?.trim()) {
					const term = command.search.trim().toLowerCase();
					const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
					if (!fullName.includes(term) && !user.email.toLowerCase().includes(term)) {
						continue;
					}
				}

				memberships.push(
					new UserWithMembershipResponseDto(
						user.id,
						user.email,
						user.firstName,
						user.lastName,
						uT.role,
						uT.isActive,
						user.mustChangePassword,
						tenant?.id,
						tenant?.name,
						user.createdAt?.toISOString(),
					),
				);
			}

			return {
				total: entities.total,
				items: memberships,
				limit: command.limit,
				page: command.page,
				totalPages: Math.ceil(entities.total / command.limit) || 1,
			};
		}

		// Cross-tenant listing (SuperAdmin)
		const { total, items: users } = await this.userRepo.list({
			page: command.page,
			limit: command.limit,
			search: command.search,
		});

		const memberships: UserWithMembershipResponseDto[] = [];
		for (const user of users) {
			const userMemberships = await this.memberRepo.findByUserId(user.id);

			let role: Roles = ROLES.SUPERADMIN;
			let tenantId: string | undefined;
			let tenantName: string | undefined = 'Global';
			let isActive = user.isActive;

			if (userMemberships.length > 0) {
				const primary =
					userMemberships.find((m) => m.isActive) ?? userMemberships[0];
				role = primary.role;
				tenantId = primary.tenantId;
				isActive = primary.isActive;
				const tenant = await this.tenantRepo.findById(primary.tenantId);
				tenantName = tenant ? tenant.name : 'Desconocido';
			}

			if (command.role && role !== command.role) {
				continue;
			}

			memberships.push(
				new UserWithMembershipResponseDto(
					user.id,
					user.email,
					user.firstName,
					user.lastName,
					role,
					isActive,
					user.mustChangePassword,
					tenantId,
					tenantName,
					user.createdAt?.toISOString(),
				),
			);
		}

		return {
			total,
			items: memberships,
			limit: command.limit,
			page: command.page,
			totalPages: Math.ceil(total / command.limit) || 1,
		};
	}
}
