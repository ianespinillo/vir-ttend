import { Tenant } from '../entities/tenant.entity';

export interface Pagination {
	page: number;
	limit: number;
}

export interface ITenantRepository {
	findById(id: string): Promise<Tenant | null>;
	findBySubdomain(subdomain: string): Promise<Tenant | null>;
	save(tenant: Tenant): Promise<void>;
	list(props: Pagination): Promise<Tenant[]>;
}
