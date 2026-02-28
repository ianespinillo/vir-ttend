// create-tenant.handler.spec.ts
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MockProxy, mock } from 'jest-mock-extended';
import { CreateTenantCommand } from '../../../src/modules/identity/application/commands/create-tenant/create-tenant.command';
import { CreateTenantHandler } from '../../../src/modules/identity/application/commands/create-tenant/create-tenant.handler';
import { Tenant } from '../../../src/modules/identity/domain/entities/tenant.entity';
import { TenantCreatedEvent } from '../../../src/modules/identity/domain/events/tenant-created.event';
import { ITenantRepository } from '../../../src/modules/identity/domain/repositories/tenant.repository.interface';

describe('CreateTenantHandler', () => {
	let handler: CreateTenantHandler;
	let tenantRepository: MockProxy<ITenantRepository>;
	let eventEmitter: MockProxy<EventEmitter2>;

	beforeEach(() => {
		tenantRepository = mock<ITenantRepository>();
		eventEmitter = mock<EventEmitter2>();

		handler = new CreateTenantHandler(tenantRepository, eventEmitter);
	});

	it('should create tenant when subdomain is unique', async () => {
		tenantRepository.findBySubdomain.mockResolvedValue(null);

		const result = await handler.execute(
			new CreateTenantCommand('Escuela 1', 'escuela-1', 'contacto@escuela1.com'),
		);

		expect(tenantRepository.save).toHaveBeenCalledTimes(1);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			'tenant.created',
			expect.any(TenantCreatedEvent),
		);
		expect(result.subdomain).toBe('escuela-1');
	});

	it('should throw when subdomain already exists', async () => {
		tenantRepository.findBySubdomain.mockResolvedValue(
			Tenant.reconstitute({
				id: 'existing-id',
				name: 'Existing',
				subdomain: 'escuela-1',
				contactEmail: 'other@escuela.com',
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		);

		await expect(
			handler.execute(
				new CreateTenantCommand('Escuela 1', 'escuela-1', 'contacto@escuela1.com'),
			),
		).rejects.toThrow();
	});
});
