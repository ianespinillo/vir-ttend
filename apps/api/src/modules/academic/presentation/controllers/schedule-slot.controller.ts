import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
	ApiCookieAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { ROLES } from '@repo/common';
import { RolesDecorator } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guard/roles.guard';
import { SetScheduleCommand } from '../../application/commands/set-schedule/set-schedule.command';
import { SetScheduleHandler } from '../../application/commands/set-schedule/set-schedule.handler';
import { ScheduleSlotResponseDto } from '../../application/dtos/schedule-slot.response.dto';
import { SetScheduleRequestDto } from '../../application/dtos/set-schedule.request.dto';
import { GetScheduleHandler } from '../../application/queries/get-schedule/get-schedule.handler';
import { GetScheduleQuery } from '../../application/queries/get-schedule/get-schedule.query';
// schedule.controller.ts
@ApiTags('Schedule')
@ApiCookieAuth('access_token')
@Controller('schedule')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScheduleController {
	constructor(
		private readonly setScheduleHandler: SetScheduleHandler,
		private readonly getScheduleHandler: GetScheduleHandler,
	) {}

	@Get()
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER)
	@ApiOperation({
		summary: 'Obtener el horario de un curso',
		description:
			'Obtiene los bloques horarios (materias, día y franja) del curso indicado. Roles permitidos: admin, preceptor, teacher. ' +
			'URL de ejemplo: /schedule?courseId=f47ac10b-58cc-4372-a567-0e02b2c3d479. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiQuery({
		name: 'courseId',
		required: true,
		type: String,
		description: 'ID del curso.',
		example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
	})
	@ApiResponse({
		status: 200,
		description: 'Bloques horarios del curso.',
		type: [ScheduleSlotResponseDto],
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	async get(@Query('courseId') courseId: string) {
		return this.getScheduleHandler.execute(new GetScheduleQuery(courseId));
	}

	@Post()
	@RolesDecorator(ROLES.ADMIN)
	@ApiOperation({
		summary: 'Asignar horario a una materia',
		description:
			'Reemplaza el horario completo de la materia indicada, validando que no haya superposición con los horarios del curso. Roles permitidos: admin. ' +
			'Body de ejemplo: {"subjectId": "550e8400-e29b-41d4-a716-446655440000", "slots": [{"dayOfWeek": "monday", "startTime": "08:00", "endTime": "09:00"}, {"dayOfWeek": "wednesday", "startTime": "08:00", "endTime": "09:00"}]}. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiResponse({ status: 201, description: 'Horario asignado a la materia.' })
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	async set(@Body() dto: SetScheduleRequestDto) {
		return this.setScheduleHandler.execute(
			new SetScheduleCommand(dto.subjectId, dto.slots),
		);
	}
}
