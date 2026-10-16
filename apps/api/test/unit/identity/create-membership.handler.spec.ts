import { ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { ConflictError, NotFoundError } from '../../../src/common/errors';
import { CreateMembershipCommand } from '../../../src/modules/identity/application/commands/create-membership/create-membership.command';
import { CreateMembershipHandler } from '../../../src/modules/identity/application/commands/create-membership/create-membership.handler';
import { Tenant } from '../../../src/modules/identity/domain/entities/tenant.entity';
import { UserTenantMembership } from '../../../src/modules/identity/domain/entities/user-tenant-membership.entity';
import { User } from '../../../src/modules/identity/domain/entities/user.entity';
import { ITenantRepository } from '../../../src/modules/identity/domain/repositories/tenant.repository.interface';
import { IUserTenantMembershipRepository } from '../../../src/modules/identity/domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../src/modules/identity/domain/repositories/user.repository.interface';

describe('CreateMembershipHandler', () => {
	let handler: CreateMembershipHandler;
	let userRepository: MockProxy<IUserRepository>;
	let memberRepository: MockProxy<IUserTenantMembershipRepository>;
	let tenantRepository: MockProxy<ITenantRepository>;

	const user = User.reconstitute({
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

	const tenant = Tenant.reconstitute({
		id: 'tenant-id',
		name: 'Tenant',
		isActive: true,
		contactEmail: 'contact@abc.gob.ar',
		subdomain: 'tenant',
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	beforeEach(() => {
		userRepository = mock<IUserRepository>();
		memberRepository = mock<IUserTenantMembershipRepository>();
		tenantRepository = mock<ITenantRepository>();

		handler = new CreateMembershipHandler(
			userRepository,
			memberRepository,
			tenantRepository,
		);
	});

	it('should throw NotFoundError when user does not exist', async () => {
		userRepository.findByEmail.mockResolvedValue(null);

		await expect(
			handler.execute(
				new CreateMembershipCommand('ghost@abc.gob.ar', 'tenant-id', ROLES.TEACHER),
			),
		).rejects.toStrictEqual(
			new NotFoundError('No existe un usuario con el correo ghost@abc.gob.ar.'),
		);

		expect(memberRepository.save).not.toHaveBeenCalled();
	});

	it('should throw NotFoundError when tenant does not exist', async () => {
		userRepository.findByEmail.mockResolvedValue(user);
		tenantRepository.findById.mockResolvedValue(null);

		await expect(
			handler.execute(
				new CreateMembershipCommand('tec1@abc.gob.ar', 'tenant-id', ROLES.TEACHER),
			),
		).rejects.toStrictEqual(new NotFoundError('Institución no encontrada.'));

		expect(memberRepository.save).not.toHaveBeenCalled();
	});

	it('should throw ConflictError when the relation already exists', async () => {
		userRepository.findByEmail.mockResolvedValue(user);
		tenantRepository.findById.mockResolvedValue(tenant);
		memberRepository.findByUserAndTenant.mockResolvedValue(
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

		const execute = handler.execute(
			new CreateMembershipCommand('tec1@abc.gob.ar', 'tenant-id', ROLES.TEACHER),
		);
		await expect(execute).rejects.toStrictEqual(
			new ConflictError(
				'El usuario tec1@abc.gob.ar ya pertenece a esta institución.',
			),
		);

		expect(memberRepository.save).not.toHaveBeenCalled();
	});

	it('should save a new membership with the command ids and role', async () => {
		userRepository.findByEmail.mockResolvedValue(user);
		tenantRepository.findById.mockResolvedValue(tenant);
		memberRepository.findByUserAndTenant.mockResolvedValue(null);

		await handler.execute(
			new CreateMembershipCommand('tec1@abc.gob.ar', 'tenant-id', ROLES.TEACHER),
		);

		expect(memberRepository.save).toHaveBeenCalledTimes(1);
		const saved = memberRepository.save.mock.calls[0][0];
		expect(saved).toBeInstanceOf(UserTenantMembership);
		expect(saved.userId).toBe('user-id');
		expect(saved.tenantId).toBe('tenant-id');
		expect(saved.role).toBe(ROLES.TEACHER);
	});
});
