import { ROLES } from '@repo/common';
import { type MockProxy, mock } from 'jest-mock-extended';
import { GetMyTenantsHandler } from '../../../src/modules/identity/application/queries/get-my-tenants/get-my-tenants.handler';
import { GetMyTenantsQuery } from '../../../src/modules/identity/application/queries/get-my-tenants/get-my-tenants.query';
import { Tenant } from '../../../src/modules/identity/domain/entities/tenant.entity';
import { UserTenantMembership } from '../../../src/modules/identity/domain/entities/user-tenant-membership.entity';
import { ITenantRepository } from '../../../src/modules/identity/domain/repositories/tenant.repository.interface';
import { IUserTenantMembershipRepository } from '../../../src/modules/identity/domain/repositories/user-tenant-membership.repository.interface';

describe('GetMyTenantsHandler', () => {
	let handler: GetMyTenantsHandler;
	let memberRepo: MockProxy<IUserTenantMembershipRepository>;
	let tenantRepo: MockProxy<ITenantRepository>;

	const tenant1 = Tenant.reconstitute({
		id: 't-1',
		name: 'Colegio 1',
		subdomain: 'col-1',
		contactEmail: 'c1@test.com',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	const tenant2 = Tenant.reconstitute({
		id: 't-2',
		name: 'Colegio 2',
		subdomain: 'col-2',
		contactEmail: 'c2@test.com',
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	const inactiveTenant = Tenant.reconstitute({
		id: 't-inactive',
		name: 'Colegio Inactivo',
		subdomain: 'col-inactivo',
		contactEmail: 'inactivo@test.com',
		isActive: false,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	beforeEach(() => {
		memberRepo = mock<IUserTenantMembershipRepository>();
		tenantRepo = mock<ITenantRepository>();
		handler = new GetMyTenantsHandler(memberRepo, tenantRepo);
	});

	it('returns active tenants for active memberships', async () => {
		memberRepo.findByUserId.mockResolvedValue([
			UserTenantMembership.reconstitute({
				id: 'm-1',
				userId: 'u-1',
				tenantId: 't-1',
				role: ROLES.TEACHER,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
			UserTenantMembership.reconstitute({
				id: 'm-2',
				userId: 'u-1',
				tenantId: 't-2',
				role: ROLES.PRECEPTOR,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		]);

		tenantRepo.findById.mockImplementation(async (id: string) => {
			if (id === 't-1') return tenant1;
			if (id === 't-2') return tenant2;
			return null;
		});

		const result = await handler.execute(
			new GetMyTenantsQuery('u-1', ROLES.TEACHER),
		);

		expect(result).toHaveLength(2);
		expect(result[0].id).toBe('t-1');
		expect(result[0].name).toBe('Colegio 1');
		expect(result[1].id).toBe('t-2');
		expect(result[1].name).toBe('Colegio 2');
	});

	it('excludes inactive memberships and inactive tenants', async () => {
		memberRepo.findByUserId.mockResolvedValue([
			UserTenantMembership.reconstitute({
				id: 'm-1',
				userId: 'u-1',
				tenantId: 't-1',
				role: ROLES.TEACHER,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
			UserTenantMembership.reconstitute({
				id: 'm-inactive',
				userId: 'u-1',
				tenantId: 't-2',
				role: ROLES.PRECEPTOR,
				isActive: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
			UserTenantMembership.reconstitute({
				id: 'm-3',
				userId: 'u-1',
				tenantId: 't-inactive',
				role: ROLES.TEACHER,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		]);

		tenantRepo.findById.mockImplementation(async (id: string) => {
			if (id === 't-1') return tenant1;
			if (id === 't-2') return tenant2;
			if (id === 't-inactive') return inactiveTenant;
			return null;
		});

		const result = await handler.execute(
			new GetMyTenantsQuery('u-1', ROLES.TEACHER),
		);

		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('t-1');
	});

	it('returns all active tenants when role is superadmin', async () => {
		tenantRepo.listAll.mockResolvedValue([tenant1, tenant2, inactiveTenant]);

		const result = await handler.execute(
			new GetMyTenantsQuery('sa-1', ROLES.SUPERADMIN),
		);

		expect(result).toHaveLength(2);
		expect(result.map((t) => t.id)).toEqual(['t-1', 't-2']);
		expect(memberRepo.findByUserId).not.toHaveBeenCalled();
	});
});
