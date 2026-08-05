export interface Tenant {
	id: string;
	name: string;
	subdomain: string;
	contactEmail: string;
	isActive: boolean;
	createdAt: Date;
}
