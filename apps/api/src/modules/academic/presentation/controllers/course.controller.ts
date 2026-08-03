import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	Query,
	UseGuards,
} from '@nestjs/common';
import {
	ApiCookieAuth,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { JwtPayload, LEVEL, LevelType, ROLES } from '@repo/common';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { RolesDecorator } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guard/roles.guard';
import { ValidLevelPipe } from '../../../../common/pipes/valid-level.pipe';
import { AssignPreceptorCommand } from '../../application/commands/assign-preceptor/assign-preceptor.command';
import { AssignPreceptorHandler } from '../../application/commands/assign-preceptor/assign-preceptor.handler';
import { CreateCourseCommand } from '../../application/commands/create-course/create-course.command';
import { CreateCourseHandler } from '../../application/commands/create-course/create-course.handler';
import { DeleteCourseCommand } from '../../application/commands/delete-course/delete-course.command';
import { DeleteCourseHandler } from '../../application/commands/delete-course/delete-course.handler';
import { UpdateCourseCommand } from '../../application/commands/update-course/update-course.command';
import { UpdateCourseHandler } from '../../application/commands/update-course/update-course.handler';
import { CourseDetailResponseDto } from '../../application/dtos/course-detail.response.dto';
import { CourseResponseDto } from '../../application/dtos/course.response.dto';
import { CreateCourseRequestDto } from '../../application/dtos/create-course.request.dto';
import { UpdateCourseRequestDto } from '../../application/dtos/update-course.request.dto';
import { GetCourseHandler } from '../../application/queries/get-course/get-course.handler';
import { GetCourseQuery } from '../../application/queries/get-course/get-course.query';
import { GetCoursesByPreceptorHandler } from '../../application/queries/get-courses-by-preceptor/get-courses-by-preceptor.handler';
import { GetCoursesByPreceptorQuery } from '../../application/queries/get-courses-by-preceptor/get-courses-by-preceptor.query';
import { GetCoursesHandler } from '../../application/queries/get-courses/get-courses.handler';
import { GetCoursesQuery } from '../../application/queries/get-courses/get-courses.query';
// courses.controller.ts
@ApiTags('Courses')
@ApiCookieAuth('access_token')
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
	constructor(
		private readonly createCourseHandler: CreateCourseHandler,
		private readonly updateCourseHandler: UpdateCourseHandler,
		private readonly deleteCourseHandler: DeleteCourseHandler,
		private readonly assignPreceptorHandler: AssignPreceptorHandler,
		private readonly getCoursesHandler: GetCoursesHandler,
		private readonly getCourseHandler: GetCourseHandler,
		private readonly getCoursesByPreceptorHandler: GetCoursesByPreceptorHandler,
	) {}

	@Post()
	@RolesDecorator(ROLES.ADMIN)
	@ApiOperation({
		summary: 'Crear un curso',
		description:
			'Crea un nuevo curso asociado a un año académico activo y al tenant (escuela) del usuario autenticado. Roles permitidos: admin. ' +
			'Body de ejemplo: {"academicYearId": "c9b1a7f2-8d3e-4f5a-9c6b-0d1e2f3a4b5c", "schoolId": "a1b2c3d4-5e6f-7890-abcd-ef1234567890", "level": "SECONDARY", "shift": "MORNING", "yearNumber": 1, "division": "A", "preceptorId": "d7e8f9a0-1b2c-3d4e-5f6a-7b8c9d0e1f2a"}. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiResponse({
		status: 201,
		description: 'Curso creado.',
		type: CourseResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	async create(
		@Body() dto: CreateCourseRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.createCourseHandler.execute(
			new CreateCourseCommand(
				dto.academicYearId,
				user.tenantId,
				dto.level,
				dto.shift,
				dto.yearNumber,
				dto.division,
				dto.preceptorId,
			),
		);
	}

	@Get()
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR)
	@ApiOperation({
		summary: 'Listar cursos',
		description:
			'Lista los cursos del año académico indicado, con filtros opcionales por nivel y preceptor. Roles permitidos: admin, preceptor. ' +
			'URL de ejemplo: /courses?academicYearId=c9b1a7f2-8d3e-4f5a-9c6b-0d1e2f3a4b5c&level=SECONDARY&preceptorId=d7e8f9a0-1b2c-3d4e-5f6a-7b8c9d0e1f2a. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiQuery({
		name: 'academicYearId',
		required: true,
		type: String,
		description: 'ID del año académico.',
		example: 'c9b1a7f2-8d3e-4f5a-9c6b-0d1e2f3a4b5c',
	})
	@ApiQuery({
		name: 'level',
		required: false,
		enum: LEVEL,
		description: 'Nivel educativo (opcional).',
		example: LEVEL.SECONDARY,
	})
	@ApiQuery({
		name: 'preceptorId',
		required: false,
		type: String,
		description: 'ID del preceptor (opcional).',
		example: 'd7e8f9a0-1b2c-3d4e-5f6a-7b8c9d0e1f2a',
	})
	@ApiResponse({
		status: 200,
		description: 'Lista de cursos.',
		type: [CourseResponseDto],
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	async list(
		@Query('academicYearId') academicYearId: string,
		@Query('level', new ValidLevelPipe()) level?: LevelType,
		@Query('preceptorId') preceptorId?: string,
	) {
		return this.getCoursesHandler.execute(
			new GetCoursesQuery(academicYearId, level, preceptorId),
		);
	}

	@Get('by-preceptor')
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR)
	@ApiOperation({
		summary: 'Listar cursos de un preceptor',
		description:
			'Lista los cursos asignados al preceptor autenticado para el año académico indicado. Roles permitidos: admin, preceptor. ' +
			'URL de ejemplo: /courses/by-preceptor?academicYearId=c9b1a7f2-8d3e-4f5a-9c6b-0d1e2f3a4b5c. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiQuery({
		name: 'academicYearId',
		required: true,
		type: String,
		description: 'ID del año académico.',
		example: 'c9b1a7f2-8d3e-4f5a-9c6b-0d1e2f3a4b5c',
	})
	@ApiResponse({
		status: 200,
		description: 'Lista de cursos del preceptor.',
		type: [CourseResponseDto],
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	async getByPreceptor(
		@Query('academicYearId') academicYearId: string,
		@CurrentUser() user: JwtPayload,
	) {
		return this.getCoursesByPreceptorHandler.execute(
			new GetCoursesByPreceptorQuery(user.sub, academicYearId),
		);
	}

	@Get(':id')
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER)
	@ApiOperation({
		summary: 'Obtener un curso por ID',
		description:
			'Obtiene el detalle de un curso: sus datos, materias asignadas y bloques horarios. Roles permitidos: admin, preceptor, teacher. ' +
			'URL de ejemplo: /courses/f47ac10b-58cc-4372-a567-0e02b2c3d479. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID del curso.',
		example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
	})
	@ApiResponse({
		status: 200,
		description: 'Detalle del curso.',
		type: CourseDetailResponseDto,
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Curso no encontrado' })
	async getOne(@Param('id') id: string) {
		return this.getCourseHandler.execute(new GetCourseQuery(id));
	}

	@Put(':id')
	@RolesDecorator(ROLES.ADMIN)
	@ApiOperation({
		summary: 'Actualizar un curso',
		description:
			'Actualiza el preceptor y/o el turno de un curso existente. Roles permitidos: admin. ' +
			'Body de ejemplo: {"preceptorId": "d7e8f9a0-1b2c-3d4e-5f6a-7b8c9d0e1f2a", "shift": "AFTERNOON"}. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID del curso a actualizar.',
		example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
	})
	@ApiResponse({ status: 200, description: 'Curso actualizado.' })
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Curso no encontrado' })
	async update(@Param('id') id: string, @Body() dto: UpdateCourseRequestDto) {
		return this.updateCourseHandler.execute(
			new UpdateCourseCommand(id, dto.preceptorId, dto.shift),
		);
	}

	@Delete(':id')
	@RolesDecorator(ROLES.ADMIN)
	@ApiOperation({
		summary: 'Eliminar un curso',
		description:
			'Da de baja (desactiva) un curso existente. Roles permitidos: admin. ' +
			'URL de ejemplo: DELETE /courses/f47ac10b-58cc-4372-a567-0e02b2c3d479. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID del curso a eliminar.',
		example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
	})
	@ApiResponse({ status: 200, description: 'Curso eliminado.' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Curso no encontrado' })
	async delete(@Param('id') id: string) {
		return this.deleteCourseHandler.execute(new DeleteCourseCommand(id));
	}

	@Put(':id/preceptor')
	@RolesDecorator(ROLES.ADMIN)
	@ApiOperation({
		summary: 'Asignar un preceptor a un curso',
		description:
			'Asigna un preceptor perteneciente al tenant y con rol preceptor a un curso existente. Roles permitidos: admin. ' +
			'Body de ejemplo: {"preceptorId": "d7e8f9a0-1b2c-3d4e-5f6a-7b8c9d0e1f2a"}. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID del curso.',
		example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
	})
	@ApiResponse({ status: 200, description: 'Preceptor asignado al curso.' })
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Curso no encontrado' })
	async assignPreceptor(
		@Param('id') id: string,
		@Body('preceptorId') preceptorId: string,
	) {
		return this.assignPreceptorHandler.execute(
			new AssignPreceptorCommand(id, preceptorId),
		);
	}
}
