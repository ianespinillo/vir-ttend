import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ROLES } from '@repo/common';
import { RolesDecorator } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guard/roles.guard';
import { SetScheduleCommand } from '../../application/commands/set-schedule/set-schedule.command';
import { SetScheduleHandler } from '../../application/commands/set-schedule/set-schedule.handler';
import { SetScheduleRequestDto } from '../../application/dtos/set-schedule.request.dto';
import { GetScheduleHandler } from '../../application/queries/get-schedule/get-schedule.handler';
import { GetScheduleQuery } from '../../application/queries/get-schedule/get-schedule.query';
// schedule.controller.ts
@Controller('schedule')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScheduleController {
	constructor(
		private readonly setScheduleHandler: SetScheduleHandler,
		private readonly getScheduleHandler: GetScheduleHandler,
	) {}

	@Get()
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER)
	async get(@Query('courseId') courseId: string) {
		return this.getScheduleHandler.execute(new GetScheduleQuery(courseId));
	}

	@Post()
	@RolesDecorator(ROLES.ADMIN)
	async set(@Body() dto: SetScheduleRequestDto) {
		return this.setScheduleHandler.execute(
			new SetScheduleCommand(dto.subjectId, dto.slots),
		);
	}
}
