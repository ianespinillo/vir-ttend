import {
	Controller,
	Get,
	Param,
	Patch,
	Query,
	UseGuards,
} from '@nestjs/common';
import { JwtPayload, ROLES } from '@repo/common';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { RolesDecorator } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guard/roles.guard';

import { MarkAlertSeenHandler } from '../../application/commands/mark-alert-seen/mark-alert-seen.handler';
import { GetAlertsCountQueryHandler } from '../../application/queries/get-alerts-count/get-alerts-count.handler';
import { GetAlertsQueryHandler } from '../../application/queries/get-alerts/get-alerts.handler';
import { GetStudentAlertsQueryHandler } from '../../application/queries/get-student-alerts/get-student-alerts.handler';
import { GetUnseenAlertsQueryHandler } from '../../application/queries/get-unseen-alerts/get-unseen-alerts.handler';

import { MarkAlertSeenCommand } from '../../application/commands/mark-alert-seen/mark-alert-seen.command';
import { GetAlertsCountQuery } from '../../application/queries/get-alerts-count/get-alerts-count.query';
import { GetAlertsQuery } from '../../application/queries/get-alerts/get-alerts.query';
import { GetStudentAlertsQuery } from '../../application/queries/get-student-alerts/get-student-alerts.query';
import { GetUnseenAlertsQuery } from '../../application/queries/get-unseen-alerts/get-unseen-alerts.query';

@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertsController {
	constructor(
		private readonly getAlertsHandler: GetAlertsQueryHandler,
		private readonly getUnseenAlertsHandler: GetUnseenAlertsQueryHandler,
		private readonly getAlertsCountHandler: GetAlertsCountQueryHandler,
		private readonly getStudentAlertsHandler: GetStudentAlertsQueryHandler,
		private readonly markAlertSeenHandler: MarkAlertSeenHandler,
	) {}

	@Get()
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getAlerts(
		@CurrentUser() user: JwtPayload,
		@Query('courseId') courseId?: string,
		@Query('alertType') alertType?: string,
		@Query('page') page?: number,
		@Query('limit') limit?: number,
	) {
		return this.getAlertsHandler.execute(
			new GetAlertsQuery(
				user.tenantId,
				page ? Number(page) : 1,
				limit ? Number(limit) : 20,
				courseId,
				alertType,
			),
		);
	}

	@Get('unseen')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getUnseenAlerts(@CurrentUser() user: JwtPayload) {
		return this.getUnseenAlertsHandler.execute(
			new GetUnseenAlertsQuery(user.tenantId),
		);
	}

	@Get('count')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getAlertsCount(@CurrentUser() user: JwtPayload) {
		return this.getAlertsCountHandler.execute(
			new GetAlertsCountQuery(user.tenantId),
		);
	}

	@Get('student/:studentId')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN, ROLES.TEACHER)
	async getStudentAlerts(
		@Param('studentId') studentId: string,
		@Query('academicYearId') academicYearId: string,
	) {
		return this.getStudentAlertsHandler.execute(
			new GetStudentAlertsQuery(studentId, academicYearId),
		);
	}

	@Patch(':id/seen')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async markAsSeen(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
		return this.markAlertSeenHandler.execute(
			new MarkAlertSeenCommand(id, user.sub),
		);
	}
}
