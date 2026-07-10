// modules/attendance/presentation/controllers/dashboard.controller.ts
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { RolesDecorator } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guard/roles.guard';

import { JwtPayload, ROLES } from '@repo/common';

import { GetCourseDailyOverviewQueryHandler } from '../../application/queries/get-course-daily-overview/get-course-daily-overview.handler';
import { GetCourseDailyOverviewQuery } from '../../application/queries/get-course-daily-overview/get-course-daily-overview.query';
import { GetDashboardMetricsQueryHandler } from '../../application/queries/get-dashboard-metrics/get-dashboard-metrics.handler';
import { GetDashboardMetricsQuery } from '../../application/queries/get-dashboard-metrics/get-dashboard-metrics.query';
import { GetPreceptorDashboardQueryHandler } from '../../application/queries/get-preceptor-dashboard/get-preceptor-dashboard.handler';
import { GetPreceptorDashboardQuery } from '../../application/queries/get-preceptor-dashboard/get-preceptor-dashboard.query';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
	constructor(
		private readonly getPreceptorDashboardQueryHandler: GetPreceptorDashboardQueryHandler,
		private readonly getCourseDailyOverviewQueryHandler: GetCourseDailyOverviewQueryHandler,
		private readonly getDashboardMetricsQueryHandler: GetDashboardMetricsQueryHandler,
	) {}

	@Get()
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getDashboard(
		@CurrentUser() user: JwtPayload,
		@Query('date') date: string,
	) {
		return this.getPreceptorDashboardQueryHandler.execute(
			new GetPreceptorDashboardQuery(user.sub, new Date(date)),
		);
	}

	@Get('course/:courseId')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getCourseOverview(
		@Param('courseId') courseId: string,
		@Query('date') date: string,
	) {
		return this.getCourseDailyOverviewQueryHandler.execute(
			new GetCourseDailyOverviewQuery(courseId, new Date(date)),
		);
	}

	@Get('metrics')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getMetrics(
		@CurrentUser() user: JwtPayload,
		@Query('academicYearId') academicYearId: string,
	) {
		return this.getDashboardMetricsQueryHandler.execute(
			new GetDashboardMetricsQuery(user.sub, academicYearId),
		);
	}
}
