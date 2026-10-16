import { Inject, Injectable } from '@nestjs/common';
import { ROLES, Roles } from '@repo/common';
import { DomainError, UnauthorizedError } from '../../../../../common/errors';
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

const INVALID_CREDENTIALS = 'El correo o la contraseña son incorrectos.';

/**
 * A password that breaks the policy can never match a stored one, so it is
 * answered with the same generic error to avoid revealing that the email exists.
 */
function toPassword(raw: string): Password {
	try {
		return new Password(raw);
	} catch (error) {
		if (error instanceof DomainError)
			throw new UnauthorizedError(INVALID_CREDENTIALS);
		throw error;
	}
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
		if (!user) throw new UnauthorizedError(INVALID_CREDENTIALS);
		if (!user.isActive)
			throw new UnauthorizedError(
				'Su cuenta está desactivada. Contacte a un administrador.',
			);

		const validPassword = await this.passwordService.compare(
			toPassword(password),
			user.password,
		);
		if (!validPassword) throw new UnauthorizedError(INVALID_CREDENTIALS);

		const tenancy = getTenancyConfig();
		const memberships = await this.membersRepo.findByUserId(user.id);

		if (memberships.length === 0) {
			if (tenancy.TENANCY_MODE === 'single' && !tenancy.ALLOW_SUPERADMIN) {
				throw new UnauthorizedError(INVALID_CREDENTIALS);
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
				throw new UnauthorizedError(INVALID_CREDENTIALS);
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
