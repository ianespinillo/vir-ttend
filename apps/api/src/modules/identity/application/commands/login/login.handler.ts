import { Injectable } from '@nestjs/common';
import { Roles } from '@repo/common';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { PasswordService } from '../../../domain/services/password.service';
import { Password } from '../../../domain/value-objects/password.vo';
import { LoginCommand } from './login.command';

export interface LoginResult {
	isSuperAdmin: boolean;
	sub: string;
	tenants: { tenantId: string; role: Roles }[];
}
@Injectable()
export class LoginHandler {
	constructor(
		private readonly userRepository: IUserRepository,
		private readonly membersRepo: IUserTenantMembershipRepository,
		private readonly passwordService: PasswordService,
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
			return {
				isSuperAdmin: true,
				sub: user.id,
				tenants: [],
			};
		}
		return {
			isSuperAdmin: false,
			sub: user.id,
			tenants: memberships.map((m) => ({ tenantId: m.tenantId, role: m.role })),
		};
	}
}
