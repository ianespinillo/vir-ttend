import {
	Body,
	Controller,
	Get,
	HttpCode,
	Param,
	Post,
	Put,
	UseGuards,
} from '@nestjs/common';
import {
	ApiCookieAuth,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { JwtPayload, ROLES } from '@repo/common';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { RolesDecorator } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guard/roles.guard';
import { AssignWorkshopPreceptorCommand } from '../../application/commands/assign-workshop-preceptor/assign-workshop-preceptor.command';
import { AssignWorkshopPreceptorHandler } from '../../application/commands/assign-workshop-preceptor/assign-workshop-preceptor.handler';
import { CreateWorkshopCommissionsCommand } from '../../application/commands/create-workshop-commissions/create-workshop-commissions.command';
import { CreateWorkshopCommissionsHandler } from '../../application/commands/create-workshop-commissions/create-workshop-commissions.handler';
import { MoveStudentToCommissionCommand } from '../../application/commands/move-student-to-commission/move-student-to-commission.command';
import { MoveStudentToCommissionHandler } from '../../application/commands/move-student-to-commission/move-student-to-commission.handler';
import { RegenerateWorkshopCommissionsCommand } from '../../application/commands/regenerate-workshop-commissions/regenerate-workshop-commissions.command';
import { RegenerateWorkshopCommissionsHandler } from '../../application/commands/regenerate-workshop-commissions/regenerate-workshop-commissions.handler';
import { AssignWorkshopPreceptorRequestDto } from '../../application/dtos/assign-workshop-preceptor.request.dto';
import { RegenerateWorkshopCommissionsRequestDto } from '../../application/dtos/regenerate-workshop-commissions.request.dto';
import { WorkshopCommissionResponseDto } from '../../application/dtos/workshop-commission.response.dto';
import { GetWorkshopCommissionsHandler } from '../../application/queries/get-workshop-commissions/get-workshop-commissions.handler';
import { GetWorkshopCommissionsQuery } from '../../application/queries/get-workshop-commissions/get-workshop-commissions.query';

const ENVELOPE =
	'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.';

// workshop-commissions.controller.ts
@ApiTags('Workshop commissions')
@ApiCookieAuth('access_token')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkshopCommissionsController {
	constructor(
		private readonly createHandler: CreateWorkshopCommissionsHandler,
		private readonly regenerateHandler: RegenerateWorkshopCommissionsHandler,
		private readonly assignPreceptorHandler: AssignWorkshopPreceptorHandler,
		private readonly moveStudentHandler: MoveStudentToCommissionHandler,
		private readonly getHandler: GetWorkshopCommissionsHandler,
	) {}

	@Post('courses/:courseId/workshop-commissions')
	@RolesDecorator(ROLES.ADMIN)
	@ApiOperation({
		summary: 'Crear las comisiones de taller de un curso',
		description: `Crea las dos comisiones (1 y 2) del curso y reparte a los estudiantes activos en orden alfabético (apellido, nombre), mitad y mitad: la primera mitad (redondeo hacia arriba) a la comisión 1. Roles permitidos: admin. ${ENVELOPE}`,
	})
	@ApiParam({ name: 'courseId', description: 'ID del curso.' })
	@ApiResponse({
		status: 201,
		description: 'Comisiones creadas.',
		type: [WorkshopCommissionResponseDto],
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Curso no encontrado' })
	@ApiResponse({ status: 409, description: 'El curso ya tiene comisiones' })
	async create(
		@Param('courseId') courseId: string,
		@CurrentUser() user: JwtPayload,
	) {
		return this.createHandler.execute(
			new CreateWorkshopCommissionsCommand(courseId, user.tenantId),
		);
	}

	@Get('courses/:courseId/workshop-commissions')
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR)
	@ApiOperation({
		summary: 'Listar las comisiones de taller de un curso',
		description: `Devuelve las comisiones con su código, preceptor y estudiantes activos ordenados alfabéticamente. Lista vacía si el curso no tiene comisiones. Roles permitidos: admin, preceptor (del curso o de alguna de sus comisiones). ${ENVELOPE}`,
	})
	@ApiParam({ name: 'courseId', description: 'ID del curso.' })
	@ApiResponse({
		status: 200,
		description: 'Comisiones del curso.',
		type: [WorkshopCommissionResponseDto],
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Curso no encontrado' })
	async list(
		@Param('courseId') courseId: string,
		@CurrentUser() user: JwtPayload,
	) {
		return this.getHandler.execute(
			new GetWorkshopCommissionsQuery(
				courseId,
				user.tenantId,
				user.sub,
				user.role,
			),
		);
	}

	@Post('courses/:courseId/workshop-commissions/regenerate')
	@HttpCode(200)
	@RolesDecorator(ROLES.ADMIN)
	@ApiOperation({
		summary: 'Regenerar la división alfabética de las comisiones',
		description: `Recalcula la división alfabética 50/50 de todos los estudiantes activos del curso y los reasigna. Mueve estudiantes con historial, por eso exige {"confirm": true}. Roles permitidos: admin. ${ENVELOPE}`,
	})
	@ApiParam({ name: 'courseId', description: 'ID del curso.' })
	@ApiResponse({
		status: 200,
		description: 'Comisiones regeneradas.',
		type: [WorkshopCommissionResponseDto],
	})
	@ApiResponse({ status: 400, description: 'Falta confirmar la operación' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({
		status: 404,
		description: 'Curso no encontrado o sin comisiones',
	})
	async regenerate(
		@Param('courseId') courseId: string,
		@Body() dto: RegenerateWorkshopCommissionsRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.regenerateHandler.execute(
			new RegenerateWorkshopCommissionsCommand(
				courseId,
				user.tenantId,
				dto.confirm,
			),
		);
	}

	@Put('workshop-commissions/:id/preceptor')
	@RolesDecorator(ROLES.ADMIN)
	@ApiOperation({
		summary: 'Asignar el preceptor de una comisión',
		description: `Asigna a una comisión un preceptor activo de la escuela; null quita la asignación. Body de ejemplo: {"preceptorId": "d7e8f9a0-1b2c-3d4e-5f6a-7b8c9d0e1f2a"}. Roles permitidos: admin. ${ENVELOPE}`,
	})
	@ApiParam({ name: 'id', description: 'ID de la comisión.' })
	@ApiResponse({ status: 200, description: 'Preceptor asignado.' })
	@ApiResponse({ status: 400, description: 'El usuario no es preceptor' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Comisión no encontrada' })
	async assignPreceptor(
		@Param('id') id: string,
		@Body() dto: AssignWorkshopPreceptorRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.assignPreceptorHandler.execute(
			new AssignWorkshopPreceptorCommand(id, user.tenantId, dto.preceptorId),
		);
	}

	@Put('workshop-commissions/:id/students/:studentId')
	@RolesDecorator(ROLES.ADMIN)
	@ApiOperation({
		summary: 'Mover un estudiante a una comisión',
		description: `Mueve a un estudiante activo del curso de la comisión a esta comisión. Es idempotente. Roles permitidos: admin. ${ENVELOPE}`,
	})
	@ApiParam({ name: 'id', description: 'ID de la comisión destino.' })
	@ApiParam({ name: 'studentId', description: 'ID del estudiante.' })
	@ApiResponse({
		status: 200,
		description: 'Estudiante asignado a la comisión.',
	})
	@ApiResponse({
		status: 400,
		description: 'El estudiante no es del curso o no está activo',
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({
		status: 404,
		description: 'Comisión o estudiante no encontrado',
	})
	async moveStudent(
		@Param('id') id: string,
		@Param('studentId') studentId: string,
		@CurrentUser() user: JwtPayload,
	) {
		return this.moveStudentHandler.execute(
			new MoveStudentToCommissionCommand(id, studentId, user.tenantId),
		);
	}
}
