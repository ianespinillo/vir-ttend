export const TENANT_ROUTES = {
	tenants: '/tenants',
	tenant: (id: string) => `/tenants/${id}`,
	status: (id: string) => `/tenants/${id}/status`,
	memberships: (id: string) => `/tenants/${id}/memberships`,
	membership: (id: string) => `/tenants/memberships/${id}`,
} as const;
