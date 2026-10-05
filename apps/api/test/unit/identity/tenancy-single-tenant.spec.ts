import { ForbiddenException } from '@nestjs/common';
import { ROLES } from '@repo/common';
import type { Request, Response } from 'express';
import { MockProxy, mock } from 'jest-mock-extended';
import * as jwt from 'jsonwebtoken';
import { LoginCommand } from '../../../src/modules/identity/application/commands/login/login.command';
import { LoginHandler } from '../../../src/modules/identity/application/commands/login/login.handler';
import { TenancyBootstrapService } from '../../../src/modules/identity/application/services/tenancy-bootstrap.service';
import { Tenant } from '../../../src/modules/identity/domain/entities/tenant.entity';
import { UserTenantMembership } from '../../../src/modules/identity/domain/entities/user-tenant-membership.entity';
import { User } from '../../../src/modules/identity/domain/entities/user.entity';
import { ITenantRepository } from '../../../src/modules/identity/domain/repositories/tenant.repository.interface';
import { IUserTenantMembershipRepository } from '../../../src/modules/identity/domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../src/modules/identity/domain/repositories/user.repository.interface';
import { PasswordService } from '../../../src/modules/identity/domain/services/password.service';
import { PasswordHashed } from '../../../src/modules/identity/domain/value-objects/password-hashed.vo';
import { validateAppConfig } from '../../../src/modules/shared/config/app.config';
import { PublicConfigController } from '../../../src/modules/shared/tenants/public-config.controller';
import { TenantContextService } from '../../../src/modules/shared/tenants/tenant-context.service';
import { TenantMiddleware } from '../../../src/modules/shared/tenants/tenant.middleware';

describe('Single-Tenant Tenancy Mode', () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		for (const key of Object.keys(process.env)) {
			if (!(key in originalEnv)) {
				delete process.env[key];
			}
		}
		Object.assign(process.env, originalEnv);
	});

	afterAll(() => {
		process.env = originalEnv;
	});

	describe('Config validation (fail fast)', () => {
		it('fails in production if JWT_SECRET and JWT_REFRESH_SECRET are identical', () => {
			expect(() =>
				validateAppConfig({
					NODE_ENV: 'production',
					JWT_SECRET: 'super-secret-unique-key-1',
					JWT_REFRESH_SECRET: 'super-secret-unique-key-1',
					DATABASE_URL: 'postgresql://localhost:5432/db',
					REDIS_URL: 'redis://localhost:6379',
				}),
			).toThrow('JWT_SECRET and JWT_REFRESH_SECRET must not be identical');
		});

		it('fails in production if default/insecure secret is used', () => {
			expect(() =>
				validateAppConfig({
					NODE_ENV: 'production',
					JWT_SECRET: 'vir_ttend_super_secret_jwt_key_2026',
					JWT_REFRESH_SECRET: 'another-secret',
					DATABASE_URL: 'postgresql://localhost:5432/db',
					REDIS_URL: 'redis://localhost:6379',
				}),
			).toThrow('Insecure default JWT secrets cannot be used');
		});

		it('passes in production with valid unique secrets and database/redis URLs', () => {
			expect(() =>
				validateAppConfig({
					NODE_ENV: 'production',
					JWT_SECRET: 'my-unique-prod-secret-abc-123-xyz',
					JWT_REFRESH_SECRET: 'my-unique-prod-refresh-def-456-uvw',
					DATABASE_URL: 'postgresql://localhost:5432/db',
					REDIS_URL: 'redis://localhost:6379',
				}),
			).not.toThrow();
		});
	});

	describe('TenancyBootstrapService', () => {
		let bootstrapService: TenancyBootstrapService;
		let tenantRepo: MockProxy<ITenantRepository>;
		let userRepo: MockProxy<IUserRepository>;
		let membershipRepo: MockProxy<IUserTenantMembershipRepository>;
		let passwordService: MockProxy<PasswordService>;

		beforeEach(() => {
			tenantRepo = mock<ITenantRepository>();
			userRepo = mock<IUserRepository>();
			membershipRepo = mock<IUserTenantMembershipRepository>();
			passwordService = mock<PasswordService>();

			bootstrapService = new TenancyBootstrapService(
				tenantRepo,
				userRepo,
				membershipRepo,
				passwordService,
			);
		});

		it('skips bootstrap when TENANCY_MODE is multi', async () => {
			process.env.TENANCY_MODE = 'multi';
			await bootstrapService.onApplicationBootstrap();

			expect(tenantRepo.findById).not.toHaveBeenCalled();
			expect(userRepo.save).not.toHaveBeenCalled();
		});

		it('creates Tenant and initial ADMIN when absent in single-tenant mode', async () => {
			process.env.TENANCY_MODE = 'single';
			process.env.TENANT_ID = '00000000-0000-0000-0000-000000000001';
			process.env.TENANT_SLUG = 'colegio-nacional';
			process.env.TENANT_NAME = 'Colegio Nacional';
			process.env.BOOTSTRAP_ADMIN_EMAIL = 'admin@colegio-nacional.edu.ar';
			process.env.BOOTSTRAP_ADMIN_PASSWORD = 'AdminSecurePassword123!';

			tenantRepo.findById.mockResolvedValue(null);
			tenantRepo.findBySubdomain.mockResolvedValue(null);
			membershipRepo.findByTenant.mockResolvedValue({ total: 0, items: [] });
			userRepo.findByEmail.mockResolvedValue(null);
			passwordService.hashPassword.mockResolvedValue(
				PasswordHashed.fromHash('$2b$10$abcdefghijklmnopqrstuvwxyz123456'),
			);

			await bootstrapService.bootstrapSingleTenant();

			expect(tenantRepo.save).toHaveBeenCalledTimes(1);
			expect(userRepo.save).toHaveBeenCalledTimes(1);
			expect(membershipRepo.save).toHaveBeenCalledTimes(1);
		});

		it('is idempotent and skips creation if Tenant and Admin already exist', async () => {
			process.env.TENANCY_MODE = 'single';
			process.env.TENANT_ID = '00000000-0000-0000-0000-000000000001';
			process.env.TENANT_SLUG = 'colegio-nacional';

			const existingTenant = Tenant.reconstitute({
				id: '00000000-0000-0000-0000-000000000001',
				name: 'Colegio Nacional',
				subdomain: 'colegio-nacional',
				contactEmail: 'admin@colegio-nacional.edu.ar',
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			tenantRepo.findById.mockResolvedValue(existingTenant);
			membershipRepo.findByTenant.mockResolvedValue({
				total: 1,
				items: [mock<UserTenantMembership>()],
			});

			await bootstrapService.bootstrapSingleTenant();

			expect(tenantRepo.save).not.toHaveBeenCalled();
			expect(userRepo.save).not.toHaveBeenCalled();
			expect(membershipRepo.save).not.toHaveBeenCalled();
		});
	});

	describe('LoginHandler in single-tenant mode', () => {
		let handler: LoginHandler;
		let userRepo: MockProxy<IUserRepository>;
		let membershipRepo: MockProxy<IUserTenantMembershipRepository>;
		let passwordService: MockProxy<PasswordService>;
		let tenantRepo: MockProxy<ITenantRepository>;

		const user = User.reconstitute({
			id: 'user-1',
			email: 'teacher@school.edu.ar',
			passwordHash: 'hashed',
			firstName: 'Docente',
			lastName: 'Prueba',
			isActive: true,
			mustChangePassword: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		beforeEach(() => {
			userRepo = mock<IUserRepository>();
			membershipRepo = mock<IUserTenantMembershipRepository>();
			passwordService = mock<PasswordService>();
			tenantRepo = mock<ITenantRepository>();

			userRepo.findByEmail.mockResolvedValue(user);
			passwordService.compare.mockResolvedValue(true);

			handler = new LoginHandler(
				userRepo,
				membershipRepo,
				passwordService,
				tenantRepo,
			);
		});

		it('allows login when user has membership in configured TENANT_ID', async () => {
			process.env.TENANCY_MODE = 'single';
			process.env.TENANT_ID = '00000000-0000-0000-0000-000000000001';
			process.env.TENANT_SLUG = 'colegio-nacional';

			const membership = UserTenantMembership.reconstitute({
				id: 'm-1',
				userId: 'user-1',
				tenantId: '00000000-0000-0000-0000-000000000001',
				role: ROLES.TEACHER,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			membershipRepo.findByUserId.mockResolvedValue([membership]);
			tenantRepo.findById.mockResolvedValue(
				Tenant.reconstitute({
					id: '00000000-0000-0000-0000-000000000001',
					name: 'Colegio Nacional',
					subdomain: 'colegio-nacional',
					contactEmail: 'admin@colegio.edu.ar',
					isActive: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				}),
			);

			const result = await handler.execute(
				new LoginCommand('teacher@school.edu.ar', 'Password123!'),
			);

			expect(result.isSuperAdmin).toBe(false);
			expect(result.tenants).toHaveLength(1);
			expect(result.tenants[0].tenantId).toBe(
				'00000000-0000-0000-0000-000000000001',
			);
		});

		it('rejects login if user does NOT belong to configured TENANT_ID', async () => {
			process.env.TENANCY_MODE = 'single';
			process.env.TENANT_ID = '00000000-0000-0000-0000-000000000001';
			process.env.TENANT_SLUG = 'colegio-nacional';

			const foreignMembership = UserTenantMembership.reconstitute({
				id: 'm-foreign',
				userId: 'user-1',
				tenantId: '99999999-9999-9999-9999-999999999999',
				role: ROLES.ADMIN,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			membershipRepo.findByUserId.mockResolvedValue([foreignMembership]);

			await expect(
				handler.execute(new LoginCommand('teacher@school.edu.ar', 'Password123!')),
			).rejects.toThrow('Invalid credentials');
		});

		it('rejects superadmin login when ALLOW_SUPERADMIN is false in single mode', async () => {
			process.env.TENANCY_MODE = 'single';
			process.env.TENANT_ID = '00000000-0000-0000-0000-000000000001';
			process.env.TENANT_SLUG = 'colegio-nacional';
			process.env.ALLOW_SUPERADMIN = 'false';

			membershipRepo.findByUserId.mockResolvedValue([]);

			await expect(
				handler.execute(new LoginCommand('teacher@school.edu.ar', 'Password123!')),
			).rejects.toThrow('Invalid credentials');
		});
	});

	describe('TenantMiddleware', () => {
		let middleware: TenantMiddleware;
		let contextService: TenantContextService;

		beforeEach(() => {
			contextService = new TenantContextService();
			middleware = new TenantMiddleware(contextService);
		});

		it('sets TENANT_ID in context during single-tenant mode', () => {
			process.env.TENANCY_MODE = 'single';
			process.env.TENANT_ID = '00000000-0000-0000-0000-000000000001';
			process.env.TENANT_SLUG = 'colegio-nacional';

			const req = { cookies: {}, headers: {} } as unknown as Request;
			const res = {} as unknown as Response;
			let capturedTenantId: string | null = null;

			middleware.use(req, res, () => {
				capturedTenantId = contextService.getTenantId();
			});

			expect(capturedTenantId).toBe('00000000-0000-0000-0000-000000000001');
		});

		it('throws ForbiddenException if JWT tenantId does not match TENANT_ID in single mode', () => {
			process.env.TENANCY_MODE = 'single';
			process.env.TENANT_ID = '00000000-0000-0000-0000-000000000001';
			process.env.TENANT_SLUG = 'colegio-nacional';

			const foreignToken = jwt.sign(
				{
					sub: 'user-1',
					email: 'u@test.com',
					role: ROLES.PRECEPTOR,
					tenantId: '99999999-9999-9999-9999-999999999999',
				},
				'dummy-secret',
			);

			const req = {
				cookies: { access_token: foreignToken },
				headers: {},
			} as unknown as Request;
			const res = {} as unknown as Response;

			expect(() => middleware.use(req, res, () => {})).toThrow(ForbiddenException);
		});

		it('throws ForbiddenException for superadmin if ALLOW_SUPERADMIN is false in single mode', () => {
			process.env.TENANCY_MODE = 'single';
			process.env.TENANT_ID = '00000000-0000-0000-0000-000000000001';
			process.env.TENANT_SLUG = 'colegio-nacional';
			process.env.ALLOW_SUPERADMIN = 'false';

			const superToken = jwt.sign(
				{
					sub: 'admin-1',
					email: 'admin@global.com',
					role: ROLES.SUPERADMIN,
					tenantId: '',
				},
				'dummy-secret',
			);

			const req = {
				cookies: { access_token: superToken },
				headers: {},
			} as unknown as Request;
			const res = {} as unknown as Response;

			expect(() => middleware.use(req, res, () => {})).toThrow(ForbiddenException);
		});
	});

	describe('PublicConfigController', () => {
		it('returns public configuration matching the environment', () => {
			process.env.TENANCY_MODE = 'single';
			process.env.TENANT_ID = '00000000-0000-0000-0000-000000000001';
			process.env.TENANT_SLUG = 'colegio-nacional';
			process.env.TENANT_NAME = 'Colegio Nacional de Buenos Aires';

			const controller = new PublicConfigController();
			const config = controller.getPublicConfig();

			expect(config.tenancyMode).toBe('single');
			expect(config.tenantName).toBe('Colegio Nacional de Buenos Aires');
			expect(config.tenantSlug).toBe('colegio-nacional');
			expect(config.tenantId).toBe('00000000-0000-0000-0000-000000000001');
		});
	});
});
