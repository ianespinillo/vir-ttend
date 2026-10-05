import { Inject, Injectable } from '@nestjs/common';
import { ROLES, Roles } from '@repo/common';
import { getTenancyConfig } from '../../../../shared/config/tenancy.config';
import { ITenantRepository } from '../../../domain/repositories/tenant.repository.interface';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { PasswordService } from '../../../domain/services/password.service';
import { Password } from '../../../domain/value-objects/password.vo';
import { LoginCommand } from './login.command';

export interface LoginResult {
	isSuperAdmin: boolean;
	userId: string;
	tenants: { tenantId: string; tenantName: string; role: Roles }[];
}

@Injectable()
export class LoginHandler {
	constructor(
		@Inject('IUserRepository')
		private readonly userRepository: IUserRepository,
		@Inject('IUserTenantMembershipRepository')
		private readonly membersRepo: IUserTenantMembershipRepository,
		private readonly passwordService: PasswordService,
		@Inject('ITenantRepository')
		private readonly tenantRepo: ITenantRepository,
	) {}

	async execute(command: LoginCommand): Promise<LoginResult> {
		const { email, password } = command;
		const user = await this.userRepository.findByEmail(email);
		if (!user) throw new Error('Invalid credentials');
		if (!user.isActive) throw new Error('User not active');

		const validPassword = await this.passwordService.compare(
			new Password(password),
			user.password,
		);
		if (!validPassword) throw new Error('Invalid credentials');

		const tenancy = getTenancyConfig();
		const memberships = await this.membersRepo.findByUserId(user.id);

		if (memberships.length === 0) {
			if (tenancy.TENANCY_MODE === 'single' && !tenancy.ALLOW_SUPERADMIN) {
				throw new Error('Invalid credentials');
			}

			const all = await this.tenantRepo.list({ page: 1, limit: 10000 });
			const targetTenants =
				tenancy.TENANCY_MODE === 'single'
					? all.filter((t) => t.id === tenancy.TENANT_ID)
					: all;

			return {
				isSuperAdmin: true,
				userId: user.id,
				tenants: targetTenants.map((t) => ({
					tenantId: t.id,
					tenantName: t.name,
					role: ROLES.SUPERADMIN,
				})),
			};
		}

		if (tenancy.TENANCY_MODE === 'single') {
			const singleMembership = memberships.find(
				(m) => m.tenantId === tenancy.TENANT_ID && m.isActive,
			);
			if (!singleMembership) {
				throw new Error('Invalid credentials');
			}

			const tenant = await this.tenantRepo.findById(singleMembership.tenantId);
			return {
				isSuperAdmin: false,
				userId: user.id,
				tenants: [
					{
						tenantId: singleMembership.tenantId,
						tenantName: tenant ? tenant.name : tenancy.TENANT_NAME,
						role: singleMembership.role,
					},
				],
			};
		}

		const tenants = await Promise.all(
			memberships.map(async (m) => {
				const tenant = await this.tenantRepo.findById(m.tenantId);
				return {
					tenantId: m.tenantId,
					tenantName: tenant ? tenant.name : 'Unknown tenant',
					role: m.role,
				};
			}),
		);

		return {
			isSuperAdmin: false,
			userId: user.id,
			tenants,
		};
	}
}
