import { Inject, Injectable } from '@nestjs/common';
import { Tenant } from '../../../domain/entities/tenant.entity';
import { ITenantRepository } from '../../../domain/repositories/tenant.repository.interface';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { AdminAnalyticsResponseDto } from '../../dto/admin-analytics.response.dto';
import { AdminTotalsDto } from '../../dto/admin-totals.dto';
import { MonthlyTenantTrendDto } from '../../dto/monthly-tenant-trend.dto';
import { TenantAnalyticsDto } from '../../dto/tenant-analytics.dto';
import { GetAdminAnalyticsQuery } from './get-admin-analytics.query';

const TREND_MONTHS = 6;

const yearMonthKey = (date: Date): string =>
	`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

@Injectable()
export class GetAdminAnalyticsHandler {
	constructor(
		@Inject('ITenantRepository')
		private readonly tenantRepo: ITenantRepository,
		@Inject('IUserTenantMembershipRepository')
		private readonly membershipRepo: IUserTenantMembershipRepository,
	) {}
	private buildMonthlyTrend(
		tenants: Tenant[],
		now: Date,
	): MonthlyTenantTrendDto[] {
		const months: { month: string; count: number }[] = [];
		for (let i = TREND_MONTHS - 1; i >= 0; i--) {
			const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
			months.push({ month: yearMonthKey(date), count: 0 });
		}
		const byMonth = new Map(months.map((month) => [month.month, month]));
		for (const tenant of tenants) {
			const month = byMonth.get(yearMonthKey(tenant.createdAt));
			if (month) {
				month.count += 1;
			}
		}
		return months.map(
			(month) => new MonthlyTenantTrendDto(month.month, month.count),
		);
	}
	async execute(
		_query: GetAdminAnalyticsQuery,
	): Promise<AdminAnalyticsResponseDto> {
		const [tenants, counts] = await Promise.all([
			this.tenantRepo.listAll(),
			this.membershipRepo.countActiveByTenant(),
		]);
		const countByTenant = new Map(
			counts.map((item) => [item.tenantId, item.count]),
		);
		const activeTenants = tenants.filter((tenant) => tenant.isActive).length;
		const totalUsers = counts.reduce((sum, item) => sum + item.count, 0);

		const perTenant = tenants
			.map(
				(tenant) =>
					new TenantAnalyticsDto(
						tenant.id,
						tenant.name,
						tenant.subdomain.getRaw(),
						tenant.isActive,
						countByTenant.get(tenant.id) ?? 0,
					),
			)
			.sort(
				(a, b) => b.userCount - a.userCount || a.name.localeCompare(b.name, 'es'),
			);

		return new AdminAnalyticsResponseDto(
			new AdminTotalsDto(
				tenants.length,
				activeTenants,
				tenants.length - activeTenants,
				totalUsers,
			),
			perTenant,
			this.buildMonthlyTrend(tenants, _query.now),
		);
	}
}
