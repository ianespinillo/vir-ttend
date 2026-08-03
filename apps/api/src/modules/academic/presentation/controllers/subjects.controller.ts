import {
	BadRequestException,
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
import { JwtPayload, ROLES } from '@repo/common';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { RolesDecorator } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guard/roles.guard';
import { AssignTeacherCommand } from '../../application/commands/assign-teaher/assign-teacher.command';
import { AssignTeacherHandler } from '../../application/commands/assign-teaher/assign-teacher.handler';
import { CreateSubjectCommand } from '../../application/commands/create-subject/create-subject.command';
import { CreateSubjectHandler } from '../../application/commands/create-subject/create-subject.handler';
import { DeleteSubjectCommand } from '../../application/commands/delete-subject/delete-subject.command';
import { DeleteSubjectHandler } from '../../application/commands/delete-subject/delete-subject.handler';
import { UpdateSubjectCommand } from '../../application/commands/update-subject/update-subject.command';
import { UpdateSubjectHandler } from '../../application/commands/update-subject/update-subject.handler';
import { CreateSubjectRequestDto } from '../../application/dtos/create-subject.request.dto';
import { SubjectResponseDto } from '../../application/dtos/subject.response.dto';
import { UpdateSubjectRequestDto } from '../../application/dtos/update-subject.request.dto';
import { GetSubjectsByCourseHandler } from '../../application/queries/get-subjects-by-course/get-subjects-by-course.handler';
import { GetSubjectsByCourseQuery } from '../../application/queries/get-subjects-by-course/get-subjects-by-course.query';
import { GetTeacherSubjectsQueryHandler } from '../../application/queries/get-teacher-subjects/get-teacher-subjects.handler';
import { GetTeacherSubjectsQuery } from '../../application/queries/get-teacher-subjects/get-teacher-subjects.query';
// subjects.controller.ts
@ApiTags('Subjects')
@ApiCookieAuth('access_token')
@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectsController {
	constructor(
		private readonly createSubjectHandler: CreateSubjectHandler,
		private readonly updateSubjectHandler: UpdateSubjectHandler,
		private readonly deleteSubjectHandler: DeleteSubjectHandler,
		private readonly assignTeacherHandler: AssignTeacherHandler,
		private readonly getSubjectsByCourseHandler: GetSubjectsByCourseHandler,
		private readonly getTeacherSubjectsQueryHandler: GetTeacherSubjectsQueryHandler,
	) {}

	@Post()
	@RolesDecorator(ROLES.ADMIN)
	@ApiOperation({
		summary: 'Crear una materia',
		description:
			'Crea una nueva materia para el curso indicado, asignándole un docente que pertenezca al tenant del curso. Roles permitidos: admin. ' +
			'Body de ejemplo: {"courseId": "f47ac10b-58cc-4372-a567-0e02b2c3d479", "teacherId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8", "name": "Matemática", "area": "Ciencias Exactas", "weeklyHours": 5}. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiResponse({ status: 201, description: 'Materia creada.' })
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	async create(@Body() dto: CreateSubjectRequestDto) {
		return this.createSubjectHandler.execute(
			new CreateSubjectCommand(
				dto.courseId,
				dto.teacherId,
				dto.name,
				dto.area,
				dto.weeklyHours,
			),
		);
	}

	@Get()
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER)
	@ApiOperation({
		summary: 'Listar materias de un curso',
		description:
			'Lista las materias del curso indicado. Roles permitidos: admin, preceptor, teacher. ' +
			'URL de ejemplo: /subjects?courseId=f47ac10b-58cc-4372-a567-0e02b2c3d479. ' +
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
		description: 'Materias del curso.',
		type: [SubjectResponseDto],
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	async list(@Query('courseId') courseId: string) {
		return this.getSubjectsByCourseHandler.execute(
			new GetSubjectsByCourseQuery(courseId),
		);
	}

	@Put(':id')
	@RolesDecorator(ROLES.ADMIN)
	@ApiOperation({
		summary: 'Actualizar una materia',
		description:
			'Actualiza el docente, nombre, área y/o carga horaria semanal de una materia existente. Roles permitidos: admin. ' +
			'Body de ejemplo: {"teacherId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8", "name": "Matemática", "area": "Ciencias Exactas", "weeklyHours": 6}. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID de la materia a actualizar.',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	@ApiResponse({ status: 200, description: 'Materia actualizada.' })
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Materia no encontrada' })
	async update(@Param('id') id: string, @Body() dto: UpdateSubjectRequestDto) {
		return this.updateSubjectHandler.execute(
			new UpdateSubjectCommand(
				id,
				dto.teacherId,
				dto.name,
				dto.area,
				dto.weeklyHours,
			),
		);
	}
	@Get()
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER)
	@ApiOperation({
		summary: 'Listar materias de un docente',
		description:
			'Lista las materias asignadas a un docente en el año académico indicado. Roles permitidos: admin, preceptor, teacher. ' +
			'URL de ejemplo: /subjects?teacherId=6ba7b810-9dad-11d1-80b4-00c04fd430c8&academicYearId=c9b1a7f2-8d3e-4f5a-9c6b-0d1e2f3a4b5c. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiQuery({
		name: 'teacherId',
		required: true,
		type: String,
		description: 'ID del docente.',
		example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
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
		description: 'Materias del docente.',
		type: [SubjectResponseDto],
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({
		status: 404,
		description: 'No se encontraron cursos para el año académico',
	})
	async getSubjects(
		@Query('teacherId') teacherId: string,
		@Query('academicYearId') academicYearId: string,
	) {
		return this.getTeacherSubjectsQueryHandler.execute(
			new GetTeacherSubjectsQuery(teacherId, academicYearId),
		);
	}

	@Delete(':id')
	@RolesDecorator(ROLES.ADMIN)
	@ApiOperation({
		summary: 'Eliminar una materia',
		description:
			'Elimina (baja lógica) una materia existente. Roles permitidos: admin. ' +
			'URL de ejemplo: DELETE /subjects/550e8400-e29b-41d4-a716-446655440000. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID de la materia a eliminar.',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	@ApiResponse({ status: 200, description: 'Materia eliminada.' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Materia no encontrada' })
	async delete(@Param('id') id: string) {
		return this.deleteSubjectHandler.execute(new DeleteSubjectCommand(id));
	}

	@Put(':id/teacher')
	@RolesDecorator(ROLES.ADMIN)
	@ApiOperation({
		summary: 'Asignar un docente a una materia',
		description:
			'Asigna un docente con rol teacher y perteneciente al tenant del usuario autenticado a una materia existente. Roles permitidos: admin. ' +
			'Body de ejemplo: {"teacherId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8"}. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID de la materia.',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	@ApiResponse({ status: 200, description: 'Docente asignado a la materia.' })
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Materia no encontrada' })
	async assignTeacher(
		@Param('id') id: string,
		@Body('teacherId') teacherId: string,
		@CurrentUser() user: JwtPayload,
	) {
		return this.assignTeacherHandler.execute(
			new AssignTeacherCommand(id, teacherId, user.tenantId),
		);
	}
}
