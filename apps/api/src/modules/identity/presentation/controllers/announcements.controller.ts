import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
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
import { CreateAnnouncementCommand } from '../../application/commands/create-announcement/create-announcement.command';
import { CreateAnnouncementHandler } from '../../application/commands/create-announcement/create-announcement.handler';
import { DeleteAnnouncementCommand } from '../../application/commands/delete-announcement/delete-announcement.command';
import { DeleteAnnouncementHandler } from '../../application/commands/delete-announcement/delete-announcement.handler';
import { PublishAnnouncementCommand } from '../../application/commands/publish-announcement/publish-announcement.command';
import { PublishAnnouncementHandler } from '../../application/commands/publish-announcement/publish-announcement.handler';
import { UpdateAnnouncementCommand } from '../../application/commands/update-announcement/update-announcement.command';
import { UpdateAnnouncementHandler } from '../../application/commands/update-announcement/update-announcement.handler';
import { AnnouncementResponseDto } from '../../application/dto/announcement.response.dto';
import { AnnouncementsListResponseDto } from '../../application/dto/announcements-list.response.dto';
import { CreateAnnouncementRequestDto } from '../../application/dto/create-announcement.request.dto';
import { UpdateAnnouncementRequestDto } from '../../application/dto/update-announcement.request.dto';
import { GetAnnouncementHandler } from '../../application/queries/get-announcement/get-announcement.handler';
import { GetAnnouncementQuery } from '../../application/queries/get-announcement/get-announcement.query';
import { GetAnnouncementsForUserHandler } from '../../application/queries/get-announcements-for-user/get-announcements-for-user.handler';
import { GetAnnouncementsForUserQuery } from '../../application/queries/get-announcements-for-user/get-announcements-for-user.query';
import { GetAnnouncementsHandler } from '../../application/queries/get-announcements/get-announcements.handler';
import { GetAnnouncementsQuery } from '../../application/queries/get-announcements/get-announcements.query';
import { AnnouncementStatus } from '../../domain/entities/announcement.entity';
import { AnnouncementTargetType } from '../../domain/value-objects/announcement-target.value-object';

@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Announcements')
@ApiCookieAuth('access_token')
export class AnnouncementsController {
	constructor(
		private readonly createHandler: CreateAnnouncementHandler,
		private readonly updateHandler: UpdateAnnouncementHandler,
		private readonly publishHandler: PublishAnnouncementHandler,
		private readonly deleteHandler: DeleteAnnouncementHandler,
		private readonly getAnnouncementsHandler: GetAnnouncementsHandler,
		private readonly getAnnouncementHandler: GetAnnouncementHandler,
		private readonly getForUserHandler: GetAnnouncementsForUserHandler,
	) {}

	@Get('for-me')
	@RolesDecorator(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER)
	@ApiOperation({
		summary: 'Obtener comunicados para el usuario',
		description:
			'Devuelve los comunicados publicados relevantes para el usuario: todos los de tipo school, los del courseId indicado y los del level indicado. URL: GET /announcements/for-me?courseId=3f0b7f44-8c2a-4d1e-9b5a-1c2d3e4f5a6b&level=PRIMARY. La respuesta exitosa se envuelve en { success, data: AnnouncementResponseDto[], timeStamp }. Los errores se envuelven en { statusCode, timestamp, path, method, message, error }. Roles permitidos: SUPERADMIN, ADMIN, PRECEPTOR y TEACHER.',
	})
	@ApiQuery({
		name: 'courseId',
		required: false,
		description: 'Filtra por curso (UUID).',
		example: '3f0b7f44-8c2a-4d1e-9b5a-1c2d3e4f5a6b',
	})
	@ApiQuery({
		name: 'level',
		required: false,
		description:
			'Filtra por nivel. Valores posibles: PRIMARY, SEONDARY y DEFAULT.',
		enum: LEVEL,
		example: LEVEL.PRIMARY,
	})
	@ApiResponse({
		status: 200,
		description: 'Comunicados relevantes para el usuario.',
		type: AnnouncementResponseDto,
		isArray: true,
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	async forMe(
		@CurrentUser() user: JwtPayload,
		@Query('courseId') courseId?: string,
		@Query('level', new ValidLevelPipe()) level?: LevelType,
	) {
		return this.getForUserHandler.execute(
			new GetAnnouncementsForUserQuery(user.sub, user.tenantId, courseId, level),
		);
	}

	@Get()
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR)
	@ApiOperation({
		summary: 'Listar comunicados',
		description:
			'Lista los comunicados del tenant con filtros opcionales por status y targetType, y paginación. URL: GET /announcements?status=draft&targetType=course&page=1&limit=20. La respuesta exitosa se envuelve en { success, data: AnnouncementsListResponseDto, timeStamp }. Roles permitidos: ADMIN y PRECEPTOR.',
	})
	@ApiQuery({
		name: 'status',
		required: false,
		description: 'Filtra por estado del comunicado.',
		enum: ['draft', 'published'],
		example: 'draft',
	})
	@ApiQuery({
		name: 'targetType',
		required: false,
		description: "Filtra por tipo de audiencia ('school', 'course' o 'level').",
		enum: ['school', 'course', 'level'],
		example: 'course',
	})
	@ApiQuery({
		name: 'page',
		required: false,
		description: 'Número de página (por defecto 1).',
		type: Number,
		example: 1,
	})
	@ApiQuery({
		name: 'limit',
		required: false,
		description: 'Resultados por página (por defecto 20).',
		type: Number,
		example: 20,
	})
	@ApiResponse({
		status: 200,
		description: 'Comunicados paginados.',
		type: AnnouncementsListResponseDto,
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	async list(
		@CurrentUser() user: JwtPayload,
		@Query('status') status?: AnnouncementStatus,
		@Query('targetType') targetType?: AnnouncementTargetType,
		@Query('page') page = 1,
		@Query('limit') limit = 20,
	) {
		return this.getAnnouncementsHandler.execute(
			new GetAnnouncementsQuery(user.tenantId, targetType, status, +page, +limit),
		);
	}

	@Post()
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR)
	@ApiOperation({
		summary: 'Crear un comunicado',
		description:
			'Crea un comunicado para el tenant del usuario autenticado. Si publishAt se omite o es null, el comunicado se publica de inmediato (status published); si tiene fecha futura, queda en borrador (status draft). Body de ejemplo: { "title": "Reunión de padres", "body": "Se convoca a los padres a la reunión de inicio de ciclo lectivo.", "targetType": "course", "targetId": "3f0b7f44-8c2a-4d1e-9b5a-1c2d3e4f5a6b", "publishAt": "2026-08-10T18:00:00.000Z" }. Para targetType school no se envía targetId; para targetType level el targetId debe ser primary o secondary. La respuesta exitosa se envuelve en { success, data: AnnouncementResponseDto, timeStamp }. Roles permitidos: ADMIN y PRECEPTOR.',
	})
	@ApiResponse({
		status: 201,
		description: 'Comunicado creado.',
		type: AnnouncementResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	async create(
		@Body() dto: CreateAnnouncementRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.createHandler.execute(
			new CreateAnnouncementCommand(
				user.tenantId,
				user.sub,
				dto.title,
				dto.body,
				dto.targetType,
				dto.targetId,
				dto.publishAt,
			),
		);
	}

	@Get(':id')
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR)
	@ApiOperation({
		summary: 'Obtener un comunicado',
		description:
			'Devuelve un comunicado por id, siempre que pertenezca al tenant del usuario autenticado. URL: GET /announcements/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d. La respuesta exitosa se envuelve en { success, data: AnnouncementResponseDto, timeStamp }. Roles permitidos: ADMIN y PRECEPTOR.',
	})
	@ApiParam({
		name: 'id',
		description: 'Identificador del comunicado (UUID).',
		example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
	})
	@ApiResponse({
		status: 200,
		description: 'Comunicado.',
		type: AnnouncementResponseDto,
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({
		status: 404,
		description: 'Comunicado no encontrado o no pertenece al tenant',
	})
	async getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
		return this.getAnnouncementHandler.execute(
			new GetAnnouncementQuery(id, user.tenantId),
		);
	}

	@Put(':id')
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR)
	@ApiOperation({
		summary: 'Actualizar un comunicado',
		description:
			'Actualiza un comunicado en borrador (draft). Solo el autor o un ADMIN pueden editar; los comunicados publicados no se pueden editar. URL: PUT /announcements/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d. Body de ejemplo: { "title": "Reunión de padres - confirmado", "body": "Se confirma la reunión de inicio de ciclo lectivo el 10/08." }. La respuesta exitosa se envuelve en { success, data: AnnouncementResponseDto, timeStamp }. Roles permitidos: ADMIN y PRECEPTOR (el PRECEPTOR solo edita sus propios comunicados).',
	})
	@ApiParam({
		name: 'id',
		description: 'Identificador del comunicado (UUID).',
		example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
	})
	@ApiResponse({
		status: 200,
		description: 'Comunicado actualizado.',
		type: AnnouncementResponseDto,
	})
	@ApiResponse({
		status: 400,
		description: 'Validación falló o el comunicado ya está publicado',
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({
		status: 403,
		description: 'Rol no autorizado o no es el autor',
	})
	@ApiResponse({ status: 404, description: 'Comunicado no encontrado' })
	async update(
		@Param('id') id: string,
		@Body() dto: UpdateAnnouncementRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.updateHandler.execute(
			new UpdateAnnouncementCommand(
				id,
				user.tenantId,
				user.sub,
				user.role,
				dto.title,
				dto.body,
				dto.targetType,
				dto.targetId,
			),
		);
	}

	@Patch(':id/publish')
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR)
	@ApiOperation({
		summary: 'Publicar un comunicado',
		description:
			'Publica un comunicado en borrador y fija publishAt al momento de la publicación. Solo el autor o un ADMIN pueden publicar. URL: PATCH /announcements/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d/publish. La respuesta exitosa se envuelve en { success, data: AnnouncementResponseDto, timeStamp }. Roles permitidos: ADMIN y PRECEPTOR (el PRECEPTOR solo publica sus propios comunicados).',
	})
	@ApiParam({
		name: 'id',
		description: 'Identificador del comunicado (UUID).',
		example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
	})
	@ApiResponse({
		status: 200,
		description: 'Comunicado publicado.',
		type: AnnouncementResponseDto,
	})
	@ApiResponse({ status: 400, description: 'El comunicado ya está publicado' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({
		status: 403,
		description: 'Rol no autorizado o no es el autor',
	})
	@ApiResponse({ status: 404, description: 'Comunicado no encontrado' })
	async publish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
		return this.publishHandler.execute(
			new PublishAnnouncementCommand(id, user.tenantId, user.sub, user.role),
		);
	}

	@Delete(':id')
	@RolesDecorator(ROLES.ADMIN)
	@ApiOperation({
		summary: 'Eliminar un comunicado',
		description:
			'Elimina un comunicado del tenant. URL: DELETE /announcements/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d. Devuelve { success: true } dentro del envoltorio { success, data, timeStamp }. Roles permitidos: ADMIN.',
	})
	@ApiParam({
		name: 'id',
		description: 'Identificador del comunicado (UUID).',
		example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
	})
	@ApiResponse({
		status: 200,
		description: 'Comunicado eliminado. Devuelve { success: true }.',
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Comunicado no encontrado' })
	async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
		return this.deleteHandler.execute(
			new DeleteAnnouncementCommand(id, user.tenantId, user.role),
		);
	}
}
