import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { PasswordService } from '../../../domain/services/password.service';
import { ChangePasswordCommand } from './change-password.command';

export class ChangePasswordHandler {
	constructor(
		@Inject('IUserRepository')
		private readonly userRepository: IUserRepository,
		private readonly passwordService: PasswordService,
		private readonly em: EventEmitter2,
	) {}
	async execute(command: ChangePasswordCommand): Promise<void> {
		const user = await this.userRepository.findById(command.userId);
		if (!user)
			throw new NotFoundException(`User with id ${command.userId} not found`);
		const equals = await this.passwordService.compare(
			command.oldPassword,
			user.password,
		);
		if (!equals) throw new BadRequestException('Password does not match');
		user.changePassword(
			await this.passwordService.hashPassword(command.newPassword),
		);
		await this.userRepository.save(user);
		// TODO: implementar notificacion por email cuando se genere el modulo de mensajeria
	}
}
