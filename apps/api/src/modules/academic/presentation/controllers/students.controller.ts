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
import { JwtPayload, ROLES, StudentStatus } from '@repo/common';
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
	async getOne(@Param('id') id: string) {
		return this.getStudentHandler.execute(new GetStudentQuery(id));
	}

	@Put(':id')
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR)
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
	async delete(@Param('id') id: string) {
		return this.deleteStudentHandler.execute(new DeleteStudentCommand(id));
	}

	@Post(':id/enroll')
	@RolesDecorator(ROLES.ADMIN)
	async enroll(@Param('id') id: string, @Body() dto: EnrollStudentRequestDto) {
		return this.enrollStudentHandler.execute(
			new EnrollStudentCommand(id, dto.courseId),
		);
	}

	@Post(':id/transfer')
	@RolesDecorator(ROLES.ADMIN)
	async transfer(
		@Param('id') id: string,
		@Body() dto: TransferStudentRequestDto,
	) {
		return this.transferStudentHandler.execute(
			new TransferStudentCommand(id, dto.newCourseId),
		);
	}
}
