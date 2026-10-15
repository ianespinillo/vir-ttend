import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import {
	BusinessRuleError,
	DomainError,
	NotFoundError,
} from '../../../src/common/errors';
import { ResetUserPasswordCommand } from '../../../src/modules/identity/application/commands/reset-user-password/reset-user-password.command';
import { ResetUserPasswordHandler } from '../../../src/modules/identity/application/commands/reset-user-password/reset-user-password.handler';
import { ToggleTenantStatusCommand } from '../../../src/modules/identity/application/commands/toggle-tenant-status/toggle-tenant-status.command';
import { ToggleTenantStatusHandler } from '../../../src/modules/identity/application/commands/toggle-tenant-status/toggle-tenant-status.handler';
import { ToggleUserStatusCommand } from '../../../src/modules/identity/application/commands/toggle-user-status/toggle-user-status.command';
import { ToggleUserStatusHandler } from '../../../src/modules/identity/application/commands/toggle-user-status/toggle-user-status.handler';
import { UpdateTenantCommand } from '../../../src/modules/identity/application/commands/update-tenant/update-tenant.command';
import { UpdateTenantHandler } from '../../../src/modules/identity/application/commands/update-tenant/update-tenant.handler';
import { GetTenantHandler } from '../../../src/modules/identity/application/queries/get-tenant/get-tenant.handler';
import { GetTenantQuery } from '../../../src/modules/identity/application/queries/get-tenant/get-tenant.query';
import { GetUserWithMembershipHandler } from '../../../src/modules/identity/application/queries/get-user-with-membership/get-user-with-membership.handler';
import { GetUserWithMembershipQuery } from '../../../src/modules/identity/application/queries/get-user-with-membership/get-user-with-membership.query';
import { Announcement } from '../../../src/modules/identity/domain/entities/announcement.entity';
import { User } from '../../../src/modules/identity/domain/entities/user.entity';
import { InvalidMailException } from '../../../src/modules/identity/domain/exceptions/invalid-mail.exception';
import { ITenantRepository } from '../../../src/modules/identity/domain/repositories/tenant.repository.interface';
import { IUserTenantMembershipRepository } from '../../../src/modules/identity/domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../src/modules/identity/domain/repositories/user.repository.interface';
import { PasswordService } from '../../../src/modules/identity/domain/services/password.service';
import { AnnouncementId } from '../../../src/modules/identity/domain/value-objects/announcement-id.value-object';
import {
	AnnouncementTarget,
	AnnouncementTargetType,
} from '../../../src/modules/identity/domain/value-objects/announcement-target.value-object';
import { Email } from '../../../src/modules/identity/domain/value-objects/email.vo';
import { PasswordHashed } from '../../../src/modules/identity/domain/value-objects/password-hashed.vo';
import { Password } from '../../../src/modules/identity/domain/value-objects/password.vo';
import { Subdomain } from '../../../src/modules/identity/domain/value-objects/subdomain.vo';
import { TenantGuard } from '../../../src/modules/identity/infrastructure/auth/guards/tenant.guard';

describe('identity value objects reject invalid input with DomainError', () => {
	it('rejects a malformed email', () => {
		const create = () => new Email('not-an-email');
		expect(create).toThrow(InvalidMailException);
		expect(create).toThrow(DomainError);
		expect(create).toThrow('El correo electrónico no es válido.');
	});

	it('rejects a password that does not meet the policy', () => {
		expect(() => new Password('short')).toThrow(
			new DomainError(
				'La contraseña debe tener al menos 8 caracteres e incluir una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&).',
			),
		);
		expect(() => new Password('short')).toThrow(DomainError);
	});

	it.each([
		['subdomain', () => new Subdomain(''), 'El subdominio es obligatorio.'],
		[
			'hashed password',
			() => new PasswordHashed(''),
			'La contraseña es obligatoria.',
		],
		[
			'announcement id',
			() => new AnnouncementId(''),
			'El identificador del comunicado es obligatorio.',
		],
		[
			'announcement target type',
			() => new AnnouncementTarget('grade' as AnnouncementTargetType),
			'El tipo de destinatario del comunicado no es válido.',
		],
		[
			'announcement level target',
			() => new AnnouncementTarget('level', 'tertiary'),
			'El nivel del destinatario debe ser primario o secundario.',
		],
		[
			'announcement course target',
			() => new AnnouncementTarget('course', ''),
			'Debe indicar el curso destinatario del comunicado.',
		],
	])('rejects an empty or invalid %s', (_name, create, message) => {
		expect(create).toThrow(new DomainError(message));
		expect(create).toThrow(DomainError);
	});
});

describe('Announcement entity', () => {
	it('rejects updating a published announcement as a business rule', () => {
		const announcement = Announcement.reconstitute({
			id: 'ann-1',
			schoolId: 'school-1',
			tenantId: 'school-1',
			authorId: 'user-1',
			title: 'Titulo',
			body: 'Cuerpo',
			targetType: 'school',
			targetId: '',
			status: 'published',
			publishAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const update = () => announcement.update({ title: 'Nuevo' });
		expect(update).toThrow(BusinessRuleError);
		expect(update).toThrow('Solo se pueden editar comunicados en borrador.');
	});
});

describe('tenant handlers answer NotFoundError for a missing tenant', () => {
	let tenantRepo: MockProxy<ITenantRepository>;
	const notFound = new NotFoundError('Institución no encontrada.');

	beforeEach(() => {
		tenantRepo = mock<ITenantRepository>();
		tenantRepo.findById.mockResolvedValue(null);
	});

	it('get tenant', async () => {
		await expect(
			new GetTenantHandler(tenantRepo).execute(new GetTenantQuery('t-1')),
		).rejects.toStrictEqual(notFound);
	});

	it('update tenant', async () => {
		await expect(
			new UpdateTenantHandler(tenantRepo).execute(
				new UpdateTenantCommand('t-1', 'Nuevo'),
			),
		).rejects.toStrictEqual(notFound);
	});

	it('toggle tenant status', async () => {
		await expect(
			new ToggleTenantStatusHandler(tenantRepo).execute(
				new ToggleTenantStatusCommand('t-1', true),
			),
		).rejects.toStrictEqual(notFound);
	});
});

describe('user handlers answer NotFoundError in Spanish', () => {
	let userRepo: MockProxy<IUserRepository>;
	let memberRepo: MockProxy<IUserTenantMembershipRepository>;
	const userNotFound = new NotFoundError('Usuario no encontrado.');

	beforeEach(() => {
		userRepo = mock<IUserRepository>();
		memberRepo = mock<IUserTenantMembershipRepository>();
		userRepo.findById.mockResolvedValue(null);
	});

	it('get user with membership: missing user', async () => {
		await expect(
			new GetUserWithMembershipHandler(memberRepo, userRepo).execute(
				new GetUserWithMembershipQuery('u-1', 't-1'),
			),
		).rejects.toStrictEqual(userNotFound);
	});

	it('get user with membership: user outside the tenant', async () => {
		userRepo.findById.mockResolvedValue(
			User.reconstitute({
				id: 'u-1',
				email: 'u@test.com',
				passwordHash: 'hashed',
				firstName: 'Ana',
				lastName: 'Gomez',
				isActive: true,
				mustChangePassword: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		);
		memberRepo.findByUserAndTenant.mockResolvedValue(null);

		await expect(
			new GetUserWithMembershipHandler(memberRepo, userRepo).execute(
				new GetUserWithMembershipQuery('u-1', 't-1'),
			),
		).rejects.toStrictEqual(
			new NotFoundError('El usuario no pertenece a esta institución.'),
		);
	});

	it('reset user password: missing user', async () => {
		await expect(
			new ResetUserPasswordHandler(
				userRepo,
				memberRepo,
				mock<PasswordService>(),
			).execute(new ResetUserPasswordCommand('u-1', ROLES.ADMIN, 't-1')),
		).rejects.toStrictEqual(userNotFound);
	});

	it('toggle user status: missing user', async () => {
		await expect(
			new ToggleUserStatusHandler(userRepo, memberRepo).execute(
				new ToggleUserStatusCommand('u-1', 't-1', ROLES.ADMIN, true, 'a-1'),
			),
		).rejects.toStrictEqual(userNotFound);
	});
});

describe('TenantGuard', () => {
	const originalEnv = { ...process.env };
	const contextFor = (user: unknown, params: Record<string, string>) =>
		({
			switchToHttp: () => ({ getRequest: () => ({ user, params }) }),
		}) as unknown as ExecutionContext;

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it('answers 403 in Spanish when the user belongs to another tenant', () => {
		process.env.TENANCY_MODE = 'multi';
		const guard = new TenantGuard();
		const activate = () =>
			guard.canActivate(
				contextFor(
					{ sub: 'u-1', role: ROLES.ADMIN, tenantId: 't-1' },
					{ tenantId: 't-2' },
				),
			);

		expect(activate).toThrow(ForbiddenException);
		expect(activate).toThrow('No tiene acceso a esta institución.');
	});

	it('keeps allowing a user of the same tenant', () => {
		process.env.TENANCY_MODE = 'multi';
		const guard = new TenantGuard();
		expect(
			guard.canActivate(
				contextFor(
					{ sub: 'u-1', role: ROLES.ADMIN, tenantId: 't-1' },
					{ tenantId: 't-1' },
				),
			),
		).toBe(true);
	});
});
