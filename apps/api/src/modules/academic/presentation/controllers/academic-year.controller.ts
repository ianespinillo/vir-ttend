import {
	Body,
	Controller,
	Get,
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
import { CreateAcademicYearCommand } from '../../application/commands/create-academic-year/create-academic-year.command';
import { CreateAcademicYearHandler } from '../../application/commands/create-academic-year/create-academic-year.handler';
import { UpdateAcademicYearCommand } from '../../application/commands/update-academic-year/update-academic-year.command';
import { UpdateAcademicYearHandler } from '../../application/commands/update-academic-year/update-academic-year.handler';
import { AcademicYearResponseDto } from '../../application/dtos/academic-year.response.dto';
import { CreateAcademicYearRequestDto } from '../../application/dtos/create-academic-year.request.dto';
import { UpdateAcademicYearRequestDto } from '../../application/dtos/update-academic-year.request.dto';
import { GetAcademicYearsHandler } from '../../application/queries/get-academic-years/get-academic-years.handler';
import { GetAcademicYearsQuery } from '../../application/queries/get-academic-years/get-academic-years.query';
import { GetActiveAcademicYearHandler } from '../../application/queries/get-active-academic-year/get-active-academic-year.handler';
import { GetActiveAcademicYearQuery } from '../../application/queries/get-active-academic-year/get-active-academic-year.query';
// academic-years.controller.ts
@ApiTags('Academic Years')
@ApiCookieAuth('access_token')
@Controller('academic-years')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicYearsController {
	constructor(
		private readonly createAcademicYearHandler: CreateAcademicYearHandler,
		private readonly updateAcademicYearHandler: UpdateAcademicYearHandler,
		private readonly getAcademicYearsHandler: GetAcademicYearsHandler,
		private readonly getActiveAcademicYearHandler: GetActiveAcademicYearHandler,
	) {}

	@Post()
	@RolesDecorator(ROLES.ADMIN)
	@ApiOperation({
		summary: 'Crear un año académico',
		description:
			'Crea un nuevo año académico para el tenant (escuela) del usuario autenticado. Roles permitidos: admin. ' +
			'Body de ejemplo: {"schoolId": "a1b2c3d4-5e6f-7890-abcd-ef1234567890", "year": 2026, "startDate": "2026-03-02T00:00:00.000Z", "endDate": "2026-12-18T00:00:00.000Z", "nonWorkingDays": ["2026-07-09T00:00:00.000Z"], "absenceThresholdPercent": 15, "lateCountAbscenseAfterMinutes": 10}. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiResponse({
		status: 201,
		description: 'Año académico creado.',
		type: AcademicYearResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	async create(
		@Body() dto: CreateAcademicYearRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.createAcademicYearHandler.execute(
			new CreateAcademicYearCommand(
				user.tenantId,
				dto.year,
				dto.startDate,
				dto.endDate,
				dto.nonWorkingDays,
				dto.absenceThresholdPercent,
				dto.lateCountAbscenseAfterMinutes,
			),
		);
	}

	@Get()
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR)
	@ApiOperation({
		summary: 'Obtener el año académico del tenant',
		description:
			'Obtiene el año académico asociado al tenant (escuela) del usuario autenticado. Roles permitidos: admin, preceptor. ' +
			'URL de ejemplo: /academic-years. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiResponse({
		status: 200,
		description: 'Año académico del tenant.',
		type: AcademicYearResponseDto,
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	async list(@CurrentUser() user: JwtPayload) {
		return this.getAcademicYearsHandler.execute(
			new GetAcademicYearsQuery(user.tenantId),
		);
	}

	@Get('active')
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER)
	@ApiOperation({
		summary: 'Obtener el año académico activo',
		description:
			'Obtiene el año académico actualmente activo del tenant (escuela) del usuario autenticado. Roles permitidos: admin, preceptor, teacher. ' +
			'URL de ejemplo: /academic-years/active. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiResponse({
		status: 200,
		description: 'Año académico activo.',
		type: AcademicYearResponseDto,
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({
		status: 404,
		description: 'No existe un año académico activo',
	})
	async getActive(@CurrentUser() user: JwtPayload) {
		return this.getActiveAcademicYearHandler.execute(
			new GetActiveAcademicYearQuery(user.tenantId),
		);
	}

	@Put(':id')
	@RolesDecorator(ROLES.ADMIN)
	@ApiOperation({
		summary: 'Actualizar un año académico',
		description:
			'Actualiza los umbrales de ausencias y agrega días no laborables de un año académico existente. Roles permitidos: admin. ' +
			'Body de ejemplo: {"nonWorkingDays": ["2026-08-17T00:00:00.000Z"], "absenceThresholdPercent": 20, "lateCountAbscenseAfterMinutes": 15}. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID del año académico a actualizar.',
		example: 'e6f5a4b3-2c1d-4e5f-8a9b-0c1d2e3f4a5b',
	})
	@ApiResponse({ status: 200, description: 'Año académico actualizado.' })
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Año académico no encontrado' })
	async update(
		@Param('id') id: string,
		@Body() dto: UpdateAcademicYearRequestDto,
	) {
		return this.updateAcademicYearHandler.execute(
			new UpdateAcademicYearCommand(
				id,
				{
					absenceThresholdPercent: dto.absenceThresholdPercent,
					lateCountAbscenseAfterMinutes: dto.lateCountAbscenseAfterMinutes,
				},
				dto.nonWorkingDays,
			),
		);
	}
}
