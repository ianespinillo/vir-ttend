import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../../../../../common/errors';
import { IPasswordResetCodeRepository } from '../../../domain/repositories/password-reset-code.repository.interface';
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { PasswordService } from '../../../domain/services/password.service';
import {
	PASSWORD_RESET_MAX_ATTEMPTS,
	passwordResetCodeMatches,
} from '../../services/password-reset-code';
import { ConfirmPasswordResetCommand } from './confirm-password-reset.command';

export const INVALID_RESET_CODE_MESSAGE =
	'El código es inválido o expiró. Pedí uno nuevo.';

/**
 * Sets a new password when the emailed code matches. One code works once, a
 * handful of wrong attempts discards it, and every open session is revoked so
 * whoever knew the old password is signed out.
 */
@Injectable()
export class ConfirmPasswordResetHandler {
	constructor(
		@Inject('IUserRepository')
		private readonly userRepository: IUserRepository,
		@Inject('IPasswordResetCodeRepository')
		private readonly codeRepository: IPasswordResetCodeRepository,
		@Inject('IRefreshTokenRepository')
		private readonly refreshTokenRepository: IRefreshTokenRepository,
		private readonly passwordService: PasswordService,
	) {}

	async execute(command: ConfirmPasswordResetCommand): Promise<void> {
		const email = command.email.trim().toLowerCase();
		const user = await this.userRepository.findByEmail(email);
		if (!user || !user.isActive)
			throw new DomainError(INVALID_RESET_CODE_MESSAGE);

		const pending = await this.codeRepository.find(user.id);
		if (!pending) throw new DomainError(INVALID_RESET_CODE_MESSAGE);

		if (pending.attempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
			await this.codeRepository.delete(user.id);
			throw new DomainError(INVALID_RESET_CODE_MESSAGE);
		}

		if (!passwordResetCodeMatches(command.code.trim(), pending.codeHash)) {
			if (pending.attempts + 1 >= PASSWORD_RESET_MAX_ATTEMPTS) {
				await this.codeRepository.delete(user.id);
			} else {
				await this.codeRepository.incrementAttempts(user.id);
			}
			throw new DomainError(INVALID_RESET_CODE_MESSAGE);
		}

		// Consume the code first: a failure afterwards must not leave it reusable.
		await this.codeRepository.delete(user.id);

		user.changePassword(
			await this.passwordService.hashPassword(command.newPassword),
		);
		await this.userRepository.save(user);
		await this.refreshTokenRepository.revokeAllByUserId(user.id);
	}
}
