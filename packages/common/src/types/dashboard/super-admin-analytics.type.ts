export interface SuperAdminAnalyticsTotals {
	totalTenants: number;
	activeTenants: number;
	inactiveTenants: number;
	totalUsers: number;
}

export interface TenantAnalytics {
	id: string;
	name: string;
	subdomain: string;
	isActive: boolean;
	userCount: number;
}

export interface MonthlyTenantTrend {
	month: string;
	count: number;
}

export interface SuperAdminAnalytics {
	totals: SuperAdminAnalyticsTotals;
	perTenant: TenantAnalytics[];
	tenantsTrend: MonthlyTenantTrend[];
}
