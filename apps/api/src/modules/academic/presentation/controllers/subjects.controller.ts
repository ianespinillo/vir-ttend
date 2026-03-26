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
import { UpdateSubjectRequestDto } from '../../application/dtos/update-subject.request.dto';
import { GetSubjectsByCourseHandler } from '../../application/queries/get-subjects-by-course/get-subjects-by-course.handler';
import { GetSubjectsByCourseQuery } from '../../application/queries/get-subjects-by-course/get-subjects-by-course.query';
// subjects.controller.ts
@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectsController {
	constructor(
		private readonly createSubjectHandler: CreateSubjectHandler,
		private readonly updateSubjectHandler: UpdateSubjectHandler,
		private readonly deleteSubjectHandler: DeleteSubjectHandler,
		private readonly assignTeacherHandler: AssignTeacherHandler,
		private readonly getSubjectsByCourseHandler: GetSubjectsByCourseHandler,
	) {}

	@Post()
	@RolesDecorator(ROLES.ADMIN)
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
	async list(@Query('courseId') courseId: string) {
		return this.getSubjectsByCourseHandler.execute(
			new GetSubjectsByCourseQuery(courseId),
		);
	}

	@Put(':id')
	@RolesDecorator(ROLES.ADMIN)
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

	@Delete(':id')
	@RolesDecorator(ROLES.ADMIN)
	async delete(@Param('id') id: string) {
		return this.deleteSubjectHandler.execute(new DeleteSubjectCommand(id));
	}

	@Put(':id/teacher')
	@RolesDecorator(ROLES.ADMIN)
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
