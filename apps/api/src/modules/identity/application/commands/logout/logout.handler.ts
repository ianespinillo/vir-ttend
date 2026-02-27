import { Injectable } from '@nestjs/common';
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface';
import { TokenService } from '../../../domain/services/token.service';
import { LogoutCommand } from './logout.command';

@Injectable()
export class LogoutHandler {
	constructor(
		private readonly refreshTokenRepository: IRefreshTokenRepository,
		private readonly tokenService: TokenService,
	) {}
	async execute(command: LogoutCommand): Promise<void> {
		const { refreshToken } = command;
		const entity = await this.refreshTokenRepository.findByHash(
			this.tokenService.hashToken(refreshToken),
		);
		if (!entity) throw new Error('Invalid refresh token');
		entity.revoke();
		await this.refreshTokenRepository.save(entity);
	}
}
