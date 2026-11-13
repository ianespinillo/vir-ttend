import { EventEmitter2 } from '@nestjs/event-emitter';
import { MockProxy, mock } from 'jest-mock-extended';
import { RequestPasswordResetCommand } from '../../../src/modules/identity/application/commands/request-password-reset/request-password-reset.command';
import { RequestPasswordResetHandler } from '../../../src/modules/identity/application/commands/request-password-reset/request-password-reset.handler';
import {
	PASSWORD_RESET_CODE_TTL_MINUTES,
	passwordResetCodeMatches,
} from '../../../src/modules/identity/application/services/password-reset-code';
import { User } from '../../../src/modules/identity/domain/entities/user.entity';
import { PasswordResetRequestedEvent } from '../../../src/modules/identity/domain/events/password-reset-requested.event';
import { IPasswordResetCodeRepository } from '../../../src/modules/identity/domain/repositories/password-reset-code.repository.interface';
import { IUserRepository } from '../../../src/modules/identity/domain/repositories/user.repository.interface';

const makeUser = (isActive = true): User =>
	User.reconstitute({
		id: 'user-1',
		email: 'jane@test.com',
		passwordHash: 'hash',
		firstName: 'Jane',
		lastName: 'Roe',
		isActive,
		createdAt: new Date(),
		updatedAt: new Date(),
		mustChangePassword: false,
	});

describe('RequestPasswordResetHandler', () => {
	const NOW = new Date('2026-11-08T12:00:00Z').getTime();
	let handler: RequestPasswordResetHandler;
	let userRepo: MockProxy<IUserRepository>;
	let codeRepo: MockProxy<IPasswordResetCodeRepository>;
	let eventEmitter: MockProxy<EventEmitter2>;

	beforeEach(() => {
		jest.useFakeTimers().setSystemTime(NOW);
		userRepo = mock<IUserRepository>();
		codeRepo = mock<IPasswordResetCodeRepository>();
		eventEmitter = mock<EventEmitter2>();
		codeRepo.find.mockResolvedValue(null);
		handler = new RequestPasswordResetHandler(userRepo, codeRepo, eventEmitter);
	});

	afterEach(() => jest.useRealTimers());

	it('stores a hashed 6-digit code and emails the plain code', async () => {
		userRepo.findByEmail.mockResolvedValue(makeUser());

		await handler.execute(new RequestPasswordResetCommand('  Jane@Test.com '));

		expect(userRepo.findByEmail).toHaveBeenCalledWith('jane@test.com');
		expect(codeRepo.save).toHaveBeenCalledTimes(1);
		const [userId, entry, ttl] = codeRepo.save.mock.calls[0];
		expect(userId).toBe('user-1');
		expect(entry).toMatchObject({ attempts: 0, issuedAt: NOW });
		expect(ttl).toBe(PASSWORD_RESET_CODE_TTL_MINUTES * 60);

		const [name, event] = eventEmitter.emit.mock.calls[0] as [
			string,
			PasswordResetRequestedEvent,
		];
		expect(name).toBe('user.password-reset-requested');
		expect(event).toBeInstanceOf(PasswordResetRequestedEvent);
		expect(event.code).toMatch(/^\d{6}$/);
		expect(event).toMatchObject({
			email: 'jane@test.com',
			firstName: 'Jane',
			expiresInMinutes: PASSWORD_RESET_CODE_TTL_MINUTES,
		});
		// Only the hash is persisted, and it matches the emailed code.
		expect(entry.codeHash).not.toBe(event.code);
		expect(passwordResetCodeMatches(event.code, entry.codeHash)).toBe(true);
	});

	it('silently does nothing for an unknown email', async () => {
		userRepo.findByEmail.mockResolvedValue(null);

		await expect(
			handler.execute(new RequestPasswordResetCommand('nobody@test.com')),
		).resolves.toBeUndefined();
		expect(codeRepo.save).not.toHaveBeenCalled();
		expect(eventEmitter.emit).not.toHaveBeenCalled();
	});

	it('silently does nothing for an inactive user', async () => {
		userRepo.findByEmail.mockResolvedValue(makeUser(false));

		await handler.execute(new RequestPasswordResetCommand('jane@test.com'));

		expect(codeRepo.save).not.toHaveBeenCalled();
		expect(eventEmitter.emit).not.toHaveBeenCalled();
	});

	it('does not resend inside the cooldown', async () => {
		userRepo.findByEmail.mockResolvedValue(makeUser());
		codeRepo.find.mockResolvedValue({
			codeHash: 'x',
			attempts: 0,
			issuedAt: NOW - 30 * 1000,
		});

		await handler.execute(new RequestPasswordResetCommand('jane@test.com'));

		expect(codeRepo.save).not.toHaveBeenCalled();
		expect(eventEmitter.emit).not.toHaveBeenCalled();
	});

	it('issues a fresh code once the cooldown is over', async () => {
		userRepo.findByEmail.mockResolvedValue(makeUser());
		codeRepo.find.mockResolvedValue({
			codeHash: 'x',
			attempts: 3,
			issuedAt: NOW - 61 * 1000,
		});

		await handler.execute(new RequestPasswordResetCommand('jane@test.com'));

		expect(codeRepo.save).toHaveBeenCalledWith(
			'user-1',
			expect.objectContaining({ attempts: 0, issuedAt: NOW }),
			PASSWORD_RESET_CODE_TTL_MINUTES * 60,
		);
		expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
	});
});
