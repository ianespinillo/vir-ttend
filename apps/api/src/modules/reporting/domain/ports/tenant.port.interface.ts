import { Tenant } from '../entities/tenant.entity';

export interface ITenantPort {
	findById(id: string): Promise<Tenant | null>;
}
