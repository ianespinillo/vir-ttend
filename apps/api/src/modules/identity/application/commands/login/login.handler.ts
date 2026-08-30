import { Inject, Injectable } from '@nestjs/common';
import { ROLES, Roles } from '@repo/common';
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

		const memberships = await this.membersRepo.findByUserId(user.id);
		if (memberships.length === 0) {
			const all = await this.tenantRepo.list({ page: 1, limit: 10000 });
			return {
				isSuperAdmin: true,
				userId: user.id,
				tenants: all.map((t) => ({
					tenantId: t.id,
					tenantName: t.name,
					role: ROLES.SUPERADMIN,
				})),
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
