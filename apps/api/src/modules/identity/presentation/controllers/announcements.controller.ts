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
import { JwtPayload, LevelType, ROLES } from '@repo/common';
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
	async getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
		return this.getAnnouncementHandler.execute(
			new GetAnnouncementQuery(id, user.tenantId),
		);
	}

	@Put(':id')
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR)
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
	async publish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
		return this.publishHandler.execute(
			new PublishAnnouncementCommand(id, user.tenantId, user.sub, user.role),
		);
	}

	@Delete(':id')
	@RolesDecorator(ROLES.ADMIN)
	async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
		return this.deleteHandler.execute(
			new DeleteAnnouncementCommand(id, user.tenantId, user.role),
		);
	}
}
