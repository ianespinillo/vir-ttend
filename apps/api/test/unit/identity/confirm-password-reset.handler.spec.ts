import { MockProxy, mock } from 'jest-mock-extended';
import { DomainError } from '../../../src/common/errors';
import { ConfirmPasswordResetCommand } from '../../../src/modules/identity/application/commands/confirm-password-reset/confirm-password-reset.command';
import {
	ConfirmPasswordResetHandler,
	INVALID_RESET_CODE_MESSAGE,
} from '../../../src/modules/identity/application/commands/confirm-password-reset/confirm-password-reset.handler';
import {
	PASSWORD_RESET_MAX_ATTEMPTS,
	hashPasswordResetCode,
} from '../../../src/modules/identity/application/services/password-reset-code';
import { User } from '../../../src/modules/identity/domain/entities/user.entity';
import {
	IPasswordResetCodeRepository,
	PasswordResetCodeEntry,
} from '../../../src/modules/identity/domain/repositories/password-reset-code.repository.interface';
import { IRefreshTokenRepository } from '../../../src/modules/identity/domain/repositories/refresh-token.repository.interface';
import { IUserRepository } from '../../../src/modules/identity/domain/repositories/user.repository.interface';
import { PasswordService } from '../../../src/modules/identity/domain/services/password.service';
import { PasswordHashed } from '../../../src/modules/identity/domain/value-objects/password-hashed.vo';
import { Password } from '../../../src/modules/identity/domain/value-objects/password.vo';

const makeUser = (isActive = true): User =>
	User.reconstitute({
		id: 'user-1',
		email: 'jane@test.com',
		passwordHash: 'old-hash',
		firstName: 'Jane',
		lastName: 'Roe',
		isActive,
		createdAt: new Date(),
		updatedAt: new Date(),
		mustChangePassword: true,
	});

const entry = (attempts = 0): PasswordResetCodeEntry => ({
	codeHash: hashPasswordResetCode('123456'),
	attempts,
	issuedAt: Date.now(),
});

describe('ConfirmPasswordResetHandler', () => {
	let handler: ConfirmPasswordResetHandler;
	let userRepo: MockProxy<IUserRepository>;
	let codeRepo: MockProxy<IPasswordResetCodeRepository>;
	let refreshRepo: MockProxy<IRefreshTokenRepository>;
	let passwordService: MockProxy<PasswordService>;
	let user: User;

	const command = (code = '123456', email = 'jane@test.com') =>
		new ConfirmPasswordResetCommand(email, code, new Password('NuevaClave1!'));

	beforeEach(() => {
		userRepo = mock<IUserRepository>();
		codeRepo = mock<IPasswordResetCodeRepository>();
		refreshRepo = mock<IRefreshTokenRepository>();
		passwordService = mock<PasswordService>();
		user = makeUser();
		userRepo.findByEmail.mockResolvedValue(user);
		passwordService.hashPassword.mockResolvedValue(
			PasswordHashed.fromHash('new-hash'),
		);
		handler = new ConfirmPasswordResetHandler(
			userRepo,
			codeRepo,
			refreshRepo,
			passwordService,
		);
	});

	it('sets the new password, consumes the code and revokes sessions', async () => {
		codeRepo.find.mockResolvedValue(entry());

		await handler.execute(command('123456', ' JANE@test.com '));

		expect(userRepo.findByEmail).toHaveBeenCalledWith('jane@test.com');
		expect(codeRepo.delete).toHaveBeenCalledWith('user-1');
		expect(userRepo.save).toHaveBeenCalledWith(user);
		expect(user.password.getRaw()).toBe('new-hash');
		expect(user.mustChangePassword).toBe(false);
		expect(refreshRepo.revokeAllByUserId).toHaveBeenCalledWith('user-1');
	});

	it('rejects a wrong code and counts the attempt', async () => {
		codeRepo.find.mockResolvedValue(entry(1));

		await expect(handler.execute(command('000000'))).rejects.toThrow(
			new DomainError(INVALID_RESET_CODE_MESSAGE),
		);
		expect(codeRepo.incrementAttempts).toHaveBeenCalledWith('user-1');
		expect(codeRepo.delete).not.toHaveBeenCalled();
		expect(userRepo.save).not.toHaveBeenCalled();
	});

	it('discards the code on the last allowed wrong attempt', async () => {
		codeRepo.find.mockResolvedValue(entry(PASSWORD_RESET_MAX_ATTEMPTS - 1));

		await expect(handler.execute(command('000000'))).rejects.toThrow(
			INVALID_RESET_CODE_MESSAGE,
		);
		expect(codeRepo.delete).toHaveBeenCalledWith('user-1');
		expect(codeRepo.incrementAttempts).not.toHaveBeenCalled();
	});

	it('rejects even the right code once attempts are exhausted', async () => {
		codeRepo.find.mockResolvedValue(entry(PASSWORD_RESET_MAX_ATTEMPTS));

		await expect(handler.execute(command('123456'))).rejects.toThrow(
			INVALID_RESET_CODE_MESSAGE,
		);
		expect(codeRepo.delete).toHaveBeenCalledWith('user-1');
		expect(userRepo.save).not.toHaveBeenCalled();
	});

	it('rejects when there is no pending code', async () => {
		codeRepo.find.mockResolvedValue(null);

		await expect(handler.execute(command())).rejects.toThrow(
			INVALID_RESET_CODE_MESSAGE,
		);
		expect(userRepo.save).not.toHaveBeenCalled();
	});

	it('answers an unknown or inactive email with the same generic error', async () => {
		userRepo.findByEmail.mockResolvedValueOnce(null);
		await expect(handler.execute(command())).rejects.toThrow(
			INVALID_RESET_CODE_MESSAGE,
		);

		userRepo.findByEmail.mockResolvedValueOnce(makeUser(false));
		await expect(handler.execute(command())).rejects.toThrow(
			INVALID_RESET_CODE_MESSAGE,
		);
		expect(codeRepo.find).not.toHaveBeenCalled();
	});
});
