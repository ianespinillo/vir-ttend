import { AsyncLocalStorage } from 'node:async_hooks';
// tenant-context.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class TenantContextService {
	private readonly storage = new AsyncLocalStorage<Map<string, string | null>>();

	run(tenantId: string | null, callback: () => void): void {
		const store = new Map<string, string | null>();
		store.set('tenantId', tenantId);
		this.storage.run(store, callback);
	}

	getTenantId(): string | null {
		return this.storage.getStore()?.get('tenantId') ?? null;
	}
}
