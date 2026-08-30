import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MockProxy, mock } from 'jest-mock-extended';
import { ChangePasswordCommand } from '../../../src/modules/identity/application/commands/change-password/change-password.command';
import { ChangePasswordHandler } from '../../../src/modules/identity/application/commands/change-password/change-password.handler';
import { User } from '../../../src/modules/identity/domain/entities/user.entity';
import { IUserRepository } from '../../../src/modules/identity/domain/repositories/user.repository.interface';
import { PasswordService } from '../../../src/modules/identity/domain/services/password.service';
import { PasswordHashed } from '../../../src/modules/identity/domain/value-objects/password-hashed.vo';
import { Password } from '../../../src/modules/identity/domain/value-objects/password.vo';

describe('ChangePasswordHandler', () => {
	let handler: ChangePasswordHandler;
	let userRepository: MockProxy<IUserRepository>;
	let passwordService: MockProxy<PasswordService>;
	let eventEmitter: MockProxy<EventEmitter2>;
	let user: User;

	const oldPassword = new Password('OldPass123!');
	const newPassword = new Password('NewPass456!');

	beforeEach(() => {
		userRepository = mock<IUserRepository>();
		passwordService = mock<PasswordService>();
		eventEmitter = mock<EventEmitter2>();
		user = User.reconstitute({
			id: 'user-id',
			email: 'tec1@abc.gob.ar',
			passwordHash: 'hashed',
			firstName: 'John',
			lastName: 'Doe',
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			mustChangePassword: false,
		});

		handler = new ChangePasswordHandler(
			userRepository,
			passwordService,
			eventEmitter,
		);
	});

	it('should hash the new password and save the updated user', async () => {
		userRepository.findById.mockResolvedValue(user);
		passwordService.compare.mockResolvedValue(true);
		passwordService.hashPassword.mockResolvedValue(
			PasswordHashed.fromHash('newhashed'),
		);
		const passwordBefore = user.password;

		await handler.execute(
			new ChangePasswordCommand('user-id', oldPassword, newPassword),
		);

		expect(passwordService.compare).toHaveBeenCalledWith(
			oldPassword,
			passwordBefore,
		);
		expect(passwordService.hashPassword).toHaveBeenCalledWith(newPassword);
		expect(userRepository.save).toHaveBeenCalledTimes(1);
		expect(userRepository.save).toHaveBeenCalledWith(user);
		expect(user.password.getRaw()).toBe('newhashed');
	});

	it('should throw BadRequestException when the old password does not match', async () => {
		userRepository.findById.mockResolvedValue(user);
		passwordService.compare.mockResolvedValue(false);

		const execute = handler.execute(
			new ChangePasswordCommand('user-id', oldPassword, newPassword),
		);

		await expect(execute).rejects.toBeInstanceOf(BadRequestException);
		await expect(execute).rejects.toThrow('Password does not match');

		expect(userRepository.save).not.toHaveBeenCalled();
		expect(passwordService.hashPassword).not.toHaveBeenCalled();
	});

	it('should throw NotFoundException when the user does not exist', async () => {
		userRepository.findById.mockResolvedValue(null);

		const execute = handler.execute(
			new ChangePasswordCommand('user-id', oldPassword, newPassword),
		);

		await expect(execute).rejects.toBeInstanceOf(NotFoundException);
		await expect(execute).rejects.toThrow('User with id user-id not found');

		expect(userRepository.save).not.toHaveBeenCalled();
	});
});
