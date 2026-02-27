import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity';
import { User } from '../../../domain/entities/user.entity';
import { UserLoggedInEvent } from '../../../domain/events/user-logged-in.event';
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { TokenService } from '../../../domain/services/token.service';
import { UserResponseDto } from '../../dto/user.response.dto';
import { SelectTenantCommand } from './select-tenant.command';

interface ExpectedReturn {
	accessToken: string;
	refreshToken: string;
	user: UserResponseDto;
}

@Injectable()
export class SelectTenantHandler {
	constructor(
		private readonly userRepo: IUserRepository,
		private readonly memberRepo: IUserTenantMembershipRepository,
		private readonly refreshTokenRepo: IRefreshTokenRepository,
		private readonly tokenService: TokenService,
		private readonly em: EventEmitter2,
	) {}
	async execute(command: SelectTenantCommand): Promise<ExpectedReturn> {
		const { userId, tenantId, userAgent, ipAddress } = command;
		const membership = await this.memberRepo.findByUserAndTenant(
			userId,
			tenantId,
		);
		if (!membership?.isActive) throw new Error('Invalid tenant selection');
		const user = await this.userRepo.findById(userId);
		if (!user) throw new Error('User not found');
		const accessToken = this.tokenService.generateAccessToken({
			email: user.email,
			role: membership.role,
			tenantId: membership.tenantId,
			sub: userId,
		});
		const refToken = this.tokenService.generateRefreshToken();
		const refTokenHash = this.tokenService.hashToken(refToken);
		await this.refreshTokenRepo.save(
			RefreshToken.create({
				userId,
				token: refTokenHash,
				tenantId,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			}),
		);
		this.em.emit(
			'user.logged-in',
			new UserLoggedInEvent(userId, tenantId, ipAddress, userAgent),
		);
		const dto = new UserResponseDto();
		dto.email = user.email;
		dto.firstName = user.firstName;
		dto.id = userId;
		dto.lastName = user.lastName;
		dto.mustChangePassword = user.mustChangePassword;
		dto.role = membership.role;
		dto.tenantId = tenantId;
		return {
			accessToken,
			refreshToken: refToken,
			user: dto,
		};
	}
}
