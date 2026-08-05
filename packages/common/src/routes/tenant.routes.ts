export const TENANT_ROUTES = {
	tenants: '/tenants',
	tenant: (id: string) => `/tenants/${id}`,
	status: (id: string) => `/tenants/${id}/status`,
} as const;
