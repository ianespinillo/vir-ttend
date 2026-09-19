import { ApiProperty } from '@nestjs/swagger';
import { AdminTotalsDto } from './admin-totals.dto';
import { MonthlyTenantTrendDto } from './monthly-tenant-trend.dto';
import { TenantAnalyticsDto } from './tenant-analytics.dto';

export class AdminAnalyticsResponseDto {
	constructor(
		@(
			ApiProperty({
				description: 'Totales de la plataforma.',
				type: AdminTotalsDto,
			}) as ParameterDecorator
		)
		readonly totals: AdminTotalsDto,
		@(
			ApiProperty({
				description:
					'Instituciones con su cantidad de usuarios, ordenadas por usuarios descendente.',
				type: TenantAnalyticsDto,
				isArray: true,
			}) as ParameterDecorator
		)
		readonly perTenant: TenantAnalyticsDto[],
		@(
			ApiProperty({
				description:
					'Evolución mensual de instituciones creadas en los últimos 6 meses.',
				type: MonthlyTenantTrendDto,
				isArray: true,
			}) as ParameterDecorator
		)
		readonly tenantsTrend: MonthlyTenantTrendDto[],
	) {}
}
