import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PasswordResetRequestedEvent } from '../../../domain/events/password-reset-requested.event';
import { IPasswordResetCodeRepository } from '../../../domain/repositories/password-reset-code.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import {
	PASSWORD_RESET_CODE_TTL_MINUTES,
	PASSWORD_RESET_RESEND_COOLDOWN_MS,
	generatePasswordResetCode,
	hashPasswordResetCode,
} from '../../services/password-reset-code';
import { RequestPasswordResetCommand } from './request-password-reset.command';

/**
 * Emails a 6-digit reset code to the account's address.
 *
 * Always resolves without telling whether the email exists, is inactive or is
 * inside the resend cooldown, so the endpoint cannot be used to enumerate users.
 */
@Injectable()
export class RequestPasswordResetHandler {
	constructor(
		@Inject('IUserRepository')
		private readonly userRepository: IUserRepository,
		@Inject('IPasswordResetCodeRepository')
		private readonly codeRepository: IPasswordResetCodeRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}

	async execute(command: RequestPasswordResetCommand): Promise<void> {
		const email = command.email.trim().toLowerCase();
		const user = await this.userRepository.findByEmail(email);
		if (!user || !user.isActive) return;

		const pending = await this.codeRepository.find(user.id);
		if (
			pending &&
			Date.now() - pending.issuedAt < PASSWORD_RESET_RESEND_COOLDOWN_MS
		) {
			return;
		}

		const code = generatePasswordResetCode();
		await this.codeRepository.save(
			user.id,
			{ codeHash: hashPasswordResetCode(code), attempts: 0, issuedAt: Date.now() },
			PASSWORD_RESET_CODE_TTL_MINUTES * 60,
		);

		this.eventEmitter.emit(
			'user.password-reset-requested',
			new PasswordResetRequestedEvent(
				user.id,
				user.email,
				user.firstName,
				user.lastName,
				code,
				PASSWORD_RESET_CODE_TTL_MINUTES,
			),
		);
	}
}
