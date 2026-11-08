import { EventEmitter2 } from '@nestjs/event-emitter';
import { ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { ForbiddenError, NotFoundError } from '../../../src/common/errors';
import { ResetUserPasswordCommand } from '../../../src/modules/identity/application/commands/reset-user-password/reset-user-password.command';
import { ResetUserPasswordHandler } from '../../../src/modules/identity/application/commands/reset-user-password/reset-user-password.handler';
import { UserTenantMembership } from '../../../src/modules/identity/domain/entities/user-tenant-membership.entity';
import { User } from '../../../src/modules/identity/domain/entities/user.entity';
import { UserPasswordResetEvent } from '../../../src/modules/identity/domain/events/user-password-reset.event';
import { IUserTenantMembershipRepository } from '../../../src/modules/identity/domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../src/modules/identity/domain/repositories/user.repository.interface';
import { PasswordService } from '../../../src/modules/identity/domain/services/password.service';
import { PasswordHashed } from '../../../src/modules/identity/domain/value-objects/password-hashed.vo';

describe('ResetUserPasswordHandler', () => {
	let handler: ResetUserPasswordHandler;
	let userRepo: MockProxy<IUserRepository>;
	let memberRepo: MockProxy<IUserTenantMembershipRepository>;
	let passwordService: MockProxy<PasswordService>;
	let eventEmitter: MockProxy<EventEmitter2>;
	let user: User;

	beforeEach(() => {
		userRepo = mock<IUserRepository>();
		memberRepo = mock<IUserTenantMembershipRepository>();
		passwordService = mock<PasswordService>();
		eventEmitter = mock<EventEmitter2>();
		user = User.reconstitute({
			id: 'user-1',
			email: 'jane@test.com',
			passwordHash: 'old-hash',
			firstName: 'Jane',
			lastName: 'Roe',
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			mustChangePassword: false,
		});
		passwordService.hashPassword.mockResolvedValue(
			PasswordHashed.fromHash('new-hash'),
		);
		handler = new ResetUserPasswordHandler(
			userRepo,
			memberRepo,
			passwordService,
			eventEmitter,
		);
	});

	it('emits user.password-reset after saving and keeps the returned result', async () => {
		userRepo.findById.mockResolvedValue(user);
		memberRepo.findByUserAndTenant.mockResolvedValue(
			UserTenantMembership.create('user-1', 't-1', ROLES.PRECEPTOR),
		);

		const result = await handler.execute(
			new ResetUserPasswordCommand('user-1', ROLES.ADMIN, 't-1'),
		);

		expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
		const [name, event] = eventEmitter.emit.mock.calls[0] as [
			string,
			UserPasswordResetEvent,
		];
		expect(name).toBe('user.password-reset');
		expect(event).toBeInstanceOf(UserPasswordResetEvent);
		expect(event).toMatchObject({
			userId: 'user-1',
			email: 'jane@test.com',
			firstName: 'Jane',
			lastName: 'Roe',
			rawPassword: result.temporaryPassword,
		});
		expect(result).toEqual({
			userId: 'user-1',
			email: 'jane@test.com',
			firstName: 'Jane',
			lastName: 'Roe',
			temporaryPassword: expect.any(String),
		});
		const saveOrder = userRepo.save.mock.invocationCallOrder[0];
		const emitOrder = eventEmitter.emit.mock.invocationCallOrder[0];
		expect(saveOrder).toBeLessThan(emitOrder);
	});

	it('does not emit when the user is not found', async () => {
		userRepo.findById.mockResolvedValue(null);

		await expect(
			handler.execute(new ResetUserPasswordCommand('user-1', ROLES.ADMIN, 't-1')),
		).rejects.toBeInstanceOf(NotFoundError);
		expect(eventEmitter.emit).not.toHaveBeenCalled();
	});

	it('does not emit when the actor cannot manage the user', async () => {
		userRepo.findById.mockResolvedValue(user);
		memberRepo.findByUserAndTenant.mockResolvedValue(null);

		await expect(
			handler.execute(new ResetUserPasswordCommand('user-1', ROLES.ADMIN, 't-1')),
		).rejects.toBeInstanceOf(ForbiddenError);
		expect(userRepo.save).not.toHaveBeenCalled();
		expect(eventEmitter.emit).not.toHaveBeenCalled();
	});
});
