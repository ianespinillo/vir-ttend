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
import { JwtPayload, ROLES, STUDENTSTATUS, StudentStatus } from '@repo/common';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { RolesDecorator } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guard/roles.guard';
import { Email } from '../../../identity/domain/value-objects/email.vo';
import { CreateStudentCommand } from '../../application/commands/create-student/create-student.command';
import { CreateStudentHandler } from '../../application/commands/create-student/create-student.handler';
import { DeleteStudentCommand } from '../../application/commands/delete-student/delete-student.command';
import { DeleteStudentHandler } from '../../application/commands/delete-student/delete-student.handler';
import { EnrollStudentCommand } from '../../application/commands/enroll-student/enroll-student.command';
import { EnrollStudentHandler } from '../../application/commands/enroll-student/enroll-student.handler';
import { TransferStudentCommand } from '../../application/commands/transer-student/transer-student.command';
import { TransferStudentHandler } from '../../application/commands/transer-student/transer-student.handler';
import { UpdateStudentCommand } from '../../application/commands/update-student/update-student.command';
import { UpdateStudentHandler } from '../../application/commands/update-student/update-student.handler';
import { CreateStudentRequestDto } from '../../application/dtos/create-student.request.dto';
import { EnrollStudentRequestDto } from '../../application/dtos/enroll-student.request.dto';
import { StudentDetailResponseDto } from '../../application/dtos/student-detail.response.dto';
import { StudentsListResponseDto } from '../../application/dtos/student-list.response.dto';
import { TransferStudentRequestDto } from '../../application/dtos/transfer-student.request.dto';
import { UpdateStudentRequestDto } from '../../application/dtos/update-student.request.dto';
import { GetStudentHandler } from '../../application/queries/get-student/get-student.handler';
import { GetStudentQuery } from '../../application/queries/get-student/get-student.query';
import { GetStudentsByCourseHandler } from '../../application/queries/get-students-by-course/get-students-by-course.handler';
import { GetStudentsByCourseQuery } from '../../application/queries/get-students-by-course/get-students-by-course.query';
import { SearchStudentsHandler } from '../../application/queries/search-students/search-students.handler';
import { SearchStudentsQuery } from '../../application/queries/search-students/search-students.query';
import { CourseId } from '../../domain/value-objects/course-id.vo';
import { DocumentNumber } from '../../domain/value-objects/document-number.vo';
import { Tutor } from '../../domain/value-objects/tutor.vo';

// students.controller.ts
@ApiTags('Students')
@ApiCookieAuth('access_token')
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
	constructor(
		private readonly createStudentHandler: CreateStudentHandler,
		private readonly updateStudentHandler: UpdateStudentHandler,
		private readonly deleteStudentHandler: DeleteStudentHandler,
		private readonly enrollStudentHandler: EnrollStudentHandler,
		private readonly transferStudentHandler: TransferStudentHandler,
		private readonly getStudentHandler: GetStudentHandler,
		private readonly getStudentsByCourseHandler: GetStudentsByCourseHandler,
		private readonly searchStudentsHandler: SearchStudentsHandler,
	) {}

	@Post()
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR)
	@ApiOperation({
		summary: 'Crear un estudiante',
		description:
			'Crea un nuevo estudiante en el tenant (escuela) del usuario autenticado y lo inscribe en el curso indicado. Roles permitidos: admin, preceptor. ' +
			'Body de ejemplo: {"firstName": "Sofía", "lastName": "González", "documentNumber": "45233210", "birthDate": "2014-03-15", "courseId": "f47ac10b-58cc-4372-a567-0e02b2c3d479", "tutorName": "María González", "tutorPhone": "+54 11 5555-1234", "tutorEmail": "maria.gonzalez@example.com"}. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiResponse({
		status: 201,
		description: 'Estudiante creado.',
		type: StudentDetailResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	async create(
		@Body() dto: CreateStudentRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.createStudentHandler.execute(
			new CreateStudentCommand(
				user.tenantId,
				dto.firstName,
				dto.lastName,
				dto.courseId,
				dto.documentNumber,
				new Date(dto.birthDate),
				dto.tutorName,
				dto.tutorPhone,
				dto.tutorEmail,
			),
		);
	}

	@Get()
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR)
	@ApiOperation({
		summary: 'Listar estudiantes de un curso',
		description:
			'Lista paginada de los estudiantes del curso indicado del tenant (escuela) del usuario autenticado, con filtro opcional por estado. Roles permitidos: admin, preceptor. ' +
			'URL de ejemplo: /students?courseId=f47ac10b-58cc-4372-a567-0e02b2c3d479&status=ACTIVE&page=1&limit=20. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiQuery({
		name: 'courseId',
		required: true,
		type: String,
		description: 'ID del curso.',
		example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
	})
	@ApiQuery({
		name: 'status',
		required: false,
		enum: STUDENTSTATUS,
		description: 'Estado del estudiante (opcional).',
		example: STUDENTSTATUS.ACTIVE,
	})
	@ApiQuery({
		name: 'page',
		required: false,
		type: Number,
		description: 'Número de página (por defecto 1).',
		example: 1,
	})
	@ApiQuery({
		name: 'limit',
		required: false,
		type: Number,
		description: 'Cantidad de resultados por página (por defecto 20).',
		example: 20,
	})
	@ApiResponse({
		status: 200,
		description: 'Lista paginada de estudiantes.',
		type: StudentsListResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	async list(
		@CurrentUser() user: JwtPayload,
		@Query('courseId') courseId: string,
		@Query('status') status?: StudentStatus,
		@Query('page') page = 1,
		@Query('limit') limit = 20,
	) {
		return this.getStudentsByCourseHandler.execute(
			new GetStudentsByCourseQuery(user.tenantId, courseId, +page, +limit, status),
		);
	}

	@Get('search')
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR)
	@ApiOperation({
		summary: 'Buscar estudiantes',
		description:
			'Busca estudiantes del tenant (escuela) del usuario autenticado por nombre, apellido o documento, con paginación. Roles permitidos: admin, preceptor. ' +
			'URL de ejemplo: /students/search?q=González&page=1&limit=20. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiQuery({
		name: 'q',
		required: true,
		type: String,
		description: 'Texto de búsqueda (nombre, apellido o documento).',
		example: 'González',
	})
	@ApiQuery({
		name: 'page',
		required: false,
		type: Number,
		description: 'Número de página (por defecto 1).',
		example: 1,
	})
	@ApiQuery({
		name: 'limit',
		required: false,
		type: Number,
		description: 'Cantidad de resultados por página (por defecto 20).',
		example: 20,
	})
	@ApiResponse({
		status: 200,
		description: 'Resultados de la búsqueda.',
		type: StudentsListResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	async search(
		@CurrentUser() user: JwtPayload,
		@Query('q') query: string,
		@Query('page') page = 1,
		@Query('limit') limit = 20,
	) {
		return this.searchStudentsHandler.execute(
			new SearchStudentsQuery(query, user.tenantId, +page, +limit),
		);
	}

	@Get(':id')
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR)
	@ApiOperation({
		summary: 'Obtener un estudiante por ID',
		description:
			'Obtiene el detalle completo de un estudiante, incluidos los datos del tutor. Roles permitidos: admin, preceptor. ' +
			'URL de ejemplo: /students/9f8c6d4b-2a10-4f4e-8c3d-5b1e7a0d9f22. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID del estudiante.',
		example: '9f8c6d4b-2a10-4f4e-8c3d-5b1e7a0d9f22',
	})
	@ApiResponse({
		status: 200,
		description: 'Detalle del estudiante.',
		type: StudentDetailResponseDto,
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Estudiante no encontrado' })
	async getOne(@Param('id') id: string) {
		return this.getStudentHandler.execute(new GetStudentQuery(id));
	}

	@Put(':id')
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR)
	@ApiOperation({
		summary: 'Actualizar un estudiante',
		description:
			'Actualiza los datos personales y del tutor de un estudiante existente. Roles permitidos: admin, preceptor. ' +
			'Body de ejemplo: {"firstName": "Sofía", "lastName": "González", "birthDate": "2014-03-15", "tutorName": "María González", "tutorPhone": "+54 11 5555-1234", "tutorEmail": "maria.gonzalez@example.com"}. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID del estudiante a actualizar.',
		example: '9f8c6d4b-2a10-4f4e-8c3d-5b1e7a0d9f22',
	})
	@ApiResponse({ status: 200, description: 'Estudiante actualizado.' })
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Estudiante no encontrado' })
	async update(@Param('id') id: string, @Body() dto: UpdateStudentRequestDto) {
		return this.updateStudentHandler.execute(
			new UpdateStudentCommand(
				id,
				dto.firstName,
				dto.lastName,
				dto.birthDate ? new Date(dto.birthDate) : undefined,
				dto.tutorName,
				dto.tutorPhone,
				dto.tutorEmail,
			),
		);
	}

	@Delete(':id')
	@RolesDecorator(ROLES.ADMIN)
	@ApiOperation({
		summary: 'Eliminar un estudiante',
		description:
			'Da de baja (desactiva) a un estudiante. Roles permitidos: admin. ' +
			'URL de ejemplo: DELETE /students/9f8c6d4b-2a10-4f4e-8c3d-5b1e7a0d9f22. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID del estudiante a eliminar.',
		example: '9f8c6d4b-2a10-4f4e-8c3d-5b1e7a0d9f22',
	})
	@ApiResponse({ status: 200, description: 'Estudiante eliminado.' })
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Estudiante no encontrado' })
	async delete(@Param('id') id: string) {
		return this.deleteStudentHandler.execute(new DeleteStudentCommand(id));
	}

	@Post(':id/enroll')
	@RolesDecorator(ROLES.ADMIN)
	@ApiOperation({
		summary: 'Inscribir un estudiante en un curso',
		description:
			'Inscribe al estudiante en el curso indicado. Roles permitidos: admin. ' +
			'Body de ejemplo: {"courseId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"}. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID del estudiante a inscribir.',
		example: '9f8c6d4b-2a10-4f4e-8c3d-5b1e7a0d9f22',
	})
	@ApiResponse({ status: 201, description: 'Estudiante inscrito en el curso.' })
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Estudiante o curso no encontrado' })
	async enroll(@Param('id') id: string, @Body() dto: EnrollStudentRequestDto) {
		return this.enrollStudentHandler.execute(
			new EnrollStudentCommand(id, dto.courseId),
		);
	}

	@Post(':id/transfer')
	@RolesDecorator(ROLES.ADMIN)
	@ApiOperation({
		summary: 'Trasladar un estudiante de curso',
		description:
			'Traslada al estudiante al curso de destino indicado, marcando su estado como transferido. Roles permitidos: admin. ' +
			'Body de ejemplo: {"newCourseId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"}. ' +
			'La respuesta exitosa se envuelve en { success, data, timeStamp } y los errores en { statusCode, timestamp, path, method, message, error }.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID del estudiante a trasladar.',
		example: '9f8c6d4b-2a10-4f4e-8c3d-5b1e7a0d9f22',
	})
	@ApiResponse({ status: 201, description: 'Estudiante trasladado de curso.' })
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({
		status: 404,
		description: 'Estudiante o curso de destino no encontrado',
	})
	async transfer(
		@Param('id') id: string,
		@Body() dto: TransferStudentRequestDto,
	) {
		return this.transferStudentHandler.execute(
			new TransferStudentCommand(id, dto.newCourseId),
		);
	}
}
