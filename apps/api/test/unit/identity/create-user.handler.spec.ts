// create-user.handler.spec.ts
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { CreateUserCommand } from '../../../src/modules/identity/application/commands/create-user/create-user.command';
import { CreateUserHandler } from '../../../src/modules/identity/application/commands/create-user/create-user.handler';
import { UserTenantMembership } from '../../../src/modules/identity/domain/entities/user-tenant-membership.entity';
import { User } from '../../../src/modules/identity/domain/entities/user.entity';
import { UserCreatedEvent } from '../../../src/modules/identity/domain/events/user-created.event';
import { UserTenantLinkedEvent } from '../../../src/modules/identity/domain/events/user-tenant-linked.event';
import { IUserTenantMembershipRepository } from '../../../src/modules/identity/domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../src/modules/identity/domain/repositories/user.repository.interface';
import { PasswordService } from '../../../src/modules/identity/domain/services/password.service';
import { PasswordHashed } from '../../../src/modules/identity/domain/value-objects/password-hashed.vo';

describe('CreateUserHandler', () => {
	let handler: CreateUserHandler;
	let userRepo: MockProxy<IUserRepository>;
	let membershipRepo: MockProxy<IUserTenantMembershipRepository>;
	let passwordService: MockProxy<PasswordService>;
	let eventEmitter: MockProxy<EventEmitter2>;

	beforeEach(() => {
		userRepo = mock<IUserRepository>();
		membershipRepo = mock<IUserTenantMembershipRepository>();
		passwordService = mock<PasswordService>();
		eventEmitter = mock<EventEmitter2>();

		handler = new CreateUserHandler(
			userRepo,
			membershipRepo,
			passwordService,
			eventEmitter,
		);
	});

	it('should create a new user and membership when email does not exist', async () => {
		userRepo.findByEmail.mockResolvedValue(null);
		passwordService.hashPassword.mockResolvedValue(
			PasswordHashed.fromHash('hashed123'),
		);

		await handler.execute(
			new CreateUserCommand(
				'test@test.com',
				'John',
				'Doe',
				ROLES.PRECEPTOR,
				ROLES.ADMIN,
				'tenant-id',
			),
		);

		expect(userRepo.save).toHaveBeenCalledTimes(1);
		expect(membershipRepo.save).toHaveBeenCalledTimes(1);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			'user.created',
			expect.any(UserCreatedEvent),
		);
	});

	it('should only create membership when user already exists', async () => {
		userRepo.findByEmail.mockResolvedValue(
			User.reconstitute({
				id: 'user-id',
				email: 'existing@test.com',
				passwordHash: 'hashed',
				firstName: 'John',
				lastName: 'Doe',
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				mustChangePassword: false,
			}),
		);
		membershipRepo.findByUserAndTenant.mockResolvedValue(null);

		await handler.execute(
			new CreateUserCommand(
				'existing@test.com',
				'John',
				'Doe',
				ROLES.PRECEPTOR,
				ROLES.ADMIN,
				'tenant-id',
			),
		);

		expect(userRepo.save).not.toHaveBeenCalled();
		expect(membershipRepo.save).toHaveBeenCalledTimes(1);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			'user.tenant.linked',
			expect.any(UserTenantLinkedEvent),
		);
	});

	it('should throw when user already belongs to tenant', async () => {
		userRepo.findByEmail.mockResolvedValue(
			User.reconstitute({
				id: 'user-id',
				email: 'existing@test.com',
				passwordHash: 'hashed',
				firstName: 'John',
				lastName: 'Doe',
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				mustChangePassword: false,
			}),
		);
		membershipRepo.findByUserAndTenant.mockResolvedValue(
			UserTenantMembership.reconstitute({
				id: 'membership-id',
				userId: 'user-id',
				tenantId: 'tenant-id',
				role: ROLES.PRECEPTOR,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		);

		await expect(
			handler.execute(
				new CreateUserCommand(
					'existing@test.com',
					'John',
					'Doe',
					ROLES.PRECEPTOR,
					ROLES.ADMIN,
					'tenant-id',
				),
			),
		).rejects.toThrow('User already belongs to tenant');
	});

	it('should throw when actor cannot create target role', async () => {
		await expect(
			handler.execute(
				new CreateUserCommand(
					'test@test.com',
					'John',
					'Doe',
					ROLES.ADMIN,
					ROLES.PRECEPTOR,
					'tenant-id', // preceptor intenta crear admin
				),
			),
		).rejects.toThrow();
	});
});
