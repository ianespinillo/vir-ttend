import { MockProxy, mock } from 'jest-mock-extended';
import { GetAdminAnalyticsHandler } from '../../../src/modules/identity/application/queries/get-admin-analytics/get-admin-analytics.handler';
import { GetAdminAnalyticsQuery } from '../../../src/modules/identity/application/queries/get-admin-analytics/get-admin-analytics.query';
import { Tenant } from '../../../src/modules/identity/domain/entities/tenant.entity';
import { ITenantRepository } from '../../../src/modules/identity/domain/repositories/tenant.repository.interface';
import { IUserTenantMembershipRepository } from '../../../src/modules/identity/domain/repositories/user-tenant-membership.repository.interface';

const makeTenant = (
	id: string,
	name: string,
	isActive: boolean,
	createdAt: Date,
): Tenant =>
	Tenant.reconstitute({
		id,
		name,
		isActive,
		contactEmail: `contacto@${id}.com`,
		subdomain: id,
		createdAt,
		updatedAt: createdAt,
	});

describe('GetAdminAnalyticsHandler', () => {
	let handler: GetAdminAnalyticsHandler;
	let tenantRepo: MockProxy<ITenantRepository>;
	let membershipRepo: MockProxy<IUserTenantMembershipRepository>;

	beforeEach(() => {
		tenantRepo = mock<ITenantRepository>();
		membershipRepo = mock<IUserTenantMembershipRepository>();
		handler = new GetAdminAnalyticsHandler(tenantRepo, membershipRepo);
	});

	it('calcula totales y agrega la cantidad de usuarios por tenant', async () => {
		tenantRepo.listAll.mockResolvedValue([
			makeTenant('t1', 'Escuela A', true, new Date('2026-03-10T10:00:00Z')),
			makeTenant('t2', 'Escuela B', false, new Date('2026-08-01T10:00:00Z')),
		]);
		membershipRepo.countActiveByTenant.mockResolvedValue([
			{ tenantId: 't1', count: 4 },
		]);

		const result = await handler.execute(
			new GetAdminAnalyticsQuery(new Date('2026-08-15T12:00:00Z')),
		);

		expect(result.totals).toEqual({
			totalTenants: 2,
			activeTenants: 1,
			inactiveTenants: 1,
			totalUsers: 4,
		});
		expect(result.perTenant).toEqual([
			{
				id: 't1',
				name: 'Escuela A',
				subdomain: 't1',
				isActive: true,
				userCount: 4,
			},
			{
				id: 't2',
				name: 'Escuela B',
				subdomain: 't2',
				isActive: false,
				userCount: 0,
			},
		]);
	});

	it('ordena perTenant por usuarios descendente y desempata por nombre', async () => {
		tenantRepo.listAll.mockResolvedValue([
			makeTenant('t1', 'B Escuela', true, new Date('2026-01-01')),
			makeTenant('t2', 'A Escuela', true, new Date('2026-01-01')),
			makeTenant('t3', 'C Escuela', true, new Date('2026-01-01')),
		]);
		membershipRepo.countActiveByTenant.mockResolvedValue([
			{ tenantId: 't1', count: 5 },
			{ tenantId: 't2', count: 5 },
			{ tenantId: 't3', count: 9 },
		]);

		const result = await handler.execute(new GetAdminAnalyticsQuery());

		const ids = result.perTenant.map((t) => t.id);
		expect(ids).toEqual(['t3', 't1', 't2']);
	});

	it('arma la tendencia de los últimos 6 meses incluyendo meses vacíos', async () => {
		tenantRepo.listAll.mockResolvedValue([
			makeTenant('t1', 'Escuela A', true, new Date('2026-02-10T10:00:00Z')),
			makeTenant('t2', 'Escuela B', true, new Date('2026-07-02T10:00:00Z')),
		]);
		membershipRepo.countActiveByTenant.mockResolvedValue([]);

		const result = await handler.execute(
			new GetAdminAnalyticsQuery(new Date('2026-07-15T12:00:00Z')),
		);

		expect(result.tenantsTrend).toEqual([
			{ month: '2026-02', count: 1 },
			{ month: '2026-03', count: 0 },
			{ month: '2026-04', count: 0 },
			{ month: '2026-05', count: 0 },
			{ month: '2026-06', count: 0 },
			{ month: '2026-07', count: 1 },
		]);
	});

	it('agrupa tenants del mismo mes en un solo punto de la tendencia', async () => {
		tenantRepo.listAll.mockResolvedValue([
			makeTenant('t1', 'Escuela A', true, new Date('2026-05-01T10:00:00Z')),
			makeTenant('t2', 'Escuela B', true, new Date('2026-05-20T10:00:00Z')),
		]);
		membershipRepo.countActiveByTenant.mockResolvedValue([]);

		const result = await handler.execute(
			new GetAdminAnalyticsQuery(new Date('2026-05-30T12:00:00Z')),
		);

		const may = result.tenantsTrend.find((p) => p.month === '2026-05');
		expect(may?.count).toBe(2);
	});
});
