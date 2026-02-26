import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { TokenService } from '../../../domain/services/token.service';
import { RefreshTokenCommand } from './refresh-token.command';
export class RefreshTokenHandler {
	constructor(
		private readonly refreshTokenRepository: IRefreshTokenRepository,
		private readonly membersRepo: IUserTenantMembershipRepository,
		private readonly userRepo: IUserRepository,
		private readonly tokenService: TokenService,
	) {}
	async execute(
		command: RefreshTokenCommand,
	): Promise<{ accessToken: string; refreshToken: string }> {
		const { refreshToken } = command;
		const tokenHash = this.tokenService.hashToken(refreshToken);
		const entity = await this.refreshTokenRepository.findByHash(tokenHash);
		if (!entity?.isActive()) throw new Error('Invalid token');
		const user = await this.userRepo.findById(entity.userId);
		if (!user) throw new Error('User not found');
		const member = await this.membersRepo.findByUserAndTenant(
			user.id,
			entity.tenantId,
		);
		if (!member) throw new Error("User doen't belongs to tenant");
		if (!member.isActive) throw new Error('User not active in tenant');
		const newAccessToken = this.tokenService.generateAccessToken({
			sub: user.id,
			email: user.email,
			role: member.role,
			tenantId: member.tenantId,
		});
		return {
			refreshToken,
			accessToken: newAccessToken,
		};
	}
}
