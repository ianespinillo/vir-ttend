import { Inject, Injectable } from '@nestjs/common';
import { ROLES, Roles } from '@repo/common';
import { UnauthorizedError } from '../../../../../common/errors';
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { TokenService } from '../../../domain/services/token.service';
import { RefreshTokenCommand } from './refresh-token.command';
const INVALID_SESSION =
	'Su sesión expiró o no es válida. Inicie sesión nuevamente.';

@Injectable()
export class RefreshTokenHandler {
	constructor(
		@Inject('IRefreshTokenRepository')
		private readonly refreshTokenRepository: IRefreshTokenRepository,
		@Inject('IUserTenantMembershipRepository')
		private readonly membersRepo: IUserTenantMembershipRepository,
		@Inject('IUserRepository')
		private readonly userRepo: IUserRepository,
		private readonly tokenService: TokenService,
	) {}
	async execute(
		command: RefreshTokenCommand,
	): Promise<{ accessToken: string; refreshToken: string }> {
		const { refreshToken } = command;
		const tokenHash = this.tokenService.hashToken(refreshToken);
		const entity = await this.refreshTokenRepository.findByHash(tokenHash);
		if (!entity?.isActive()) throw new UnauthorizedError(INVALID_SESSION);
		const user = await this.userRepo.findById(entity.userId);
		if (!user) throw new UnauthorizedError(INVALID_SESSION);
		const member = await this.membersRepo.findByUserAndTenant(
			user.id,
			entity.tenantId,
		);
		let role: Roles;
		let isImpersonating = false;

		if (member) {
			if (!member.isActive)
				throw new UnauthorizedError(
					'Su cuenta está desactivada en esta institución.',
				);
			role = member.role;
		} else {
			const memberships = await this.membersRepo.findByUserId(user.id);
			if (memberships.length > 0)
				throw new UnauthorizedError('Ya no tiene acceso a esta institución.');
			if (entity.tenantId) {
				role = ROLES.ADMIN;
				isImpersonating = true;
			} else {
				role = ROLES.SUPERADMIN;
				isImpersonating = false;
			}
		}

		const newAccessToken = this.tokenService.generateAccessToken({
			sub: user.id,
			email: user.email,
			role,
			tenantId: entity.tenantId,
			isImpersonating,
		});
		return {
			refreshToken,
			accessToken: newAccessToken,
		};
	}
}
