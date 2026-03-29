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
import { JwtPayload, LevelType, ROLES } from '@repo/common';
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
import { CreateCourseRequestDto } from '../../application/dtos/create-course.request.dto';
import { UpdateCourseRequestDto } from '../../application/dtos/update-course.request.dto';
import { GetCourseHandler } from '../../application/queries/get-course/get-course.handler';
import { GetCourseQuery } from '../../application/queries/get-course/get-course.query';
import { GetCoursesByPreceptorHandler } from '../../application/queries/get-courses-by-preceptor/get-courses-by-preceptor.handler';
import { GetCoursesByPreceptorQuery } from '../../application/queries/get-courses-by-preceptor/get-courses-by-preceptor.query';
import { GetCoursesHandler } from '../../application/queries/get-courses/get-courses.handler';
import { GetCoursesQuery } from '../../application/queries/get-courses/get-courses.query';
// courses.controller.ts
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
	async getOne(@Param('id') id: string) {
		return this.getCourseHandler.execute(new GetCourseQuery(id));
	}

	@Put(':id')
	@RolesDecorator(ROLES.ADMIN)
	async update(@Param('id') id: string, @Body() dto: UpdateCourseRequestDto) {
		return this.updateCourseHandler.execute(
			new UpdateCourseCommand(id, dto.preceptorId, dto.shift),
		);
	}

	@Delete(':id')
	@RolesDecorator(ROLES.ADMIN)
	async delete(@Param('id') id: string) {
		return this.deleteCourseHandler.execute(new DeleteCourseCommand(id));
	}

	@Put(':id/preceptor')
	@RolesDecorator(ROLES.ADMIN)
	async assignPreceptor(
		@Param('id') id: string,
		@Body('preceptorId') preceptorId: string,
	) {
		return this.assignPreceptorHandler.execute(
			new AssignPreceptorCommand(id, preceptorId),
		);
	}
}
