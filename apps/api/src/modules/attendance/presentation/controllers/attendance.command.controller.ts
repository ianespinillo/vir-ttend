import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
// attendance-command.controller.ts
import { JwtPayload, ROLES } from '@repo/common';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { RolesDecorator } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guard/roles.guard';
import { BulkRegisterAttendanceCommand } from '../../application/commands/bulk-register-attendance/bulk-register-attendance.command';
import { BulkRegisterAttendanceHandler } from '../../application/commands/bulk-register-attendance/bulk-register-attendance.handler';
import { BulkUpdateSubjectStatusCommand } from '../../application/commands/bulk-update-subject-status/bulk-update-subject-status.command';
import { BulkUpdateSubjectStatusHandler } from '../../application/commands/bulk-update-subject-status/bulk-update-subject-status.handler';
import { CopyAttendanceCommand } from '../../application/commands/copy-attendance/copy-attendance.command';
import { CopyAttendanceHandler } from '../../application/commands/copy-attendance/copy-attendance.handler';
import { JustifyAttendanceCommand } from '../../application/commands/justify-attendance/justify-attendance.command';
import { JustifyAttendanceHandler } from '../../application/commands/justify-attendance/justify-attendance.handler';
import { RegisterDailyAttendanceCommand } from '../../application/commands/register-daily-attendance/register-daily-attendance.command';
import { RegisterDailyAttendanceHandler } from '../../application/commands/register-daily-attendance/register-daily-attendance.handler';
import { RegisterSubjectAttendanceCommand } from '../../application/commands/register-subject-attendance/register-subject-attendance.command';
import { RegisterSubjectAttendanceHandler } from '../../application/commands/register-subject-attendance/register-subject-attendance.handler';
import { BulkRegisterAttendanceRequestDto } from '../../application/dtos/bulk-register-attendance.request.dto';
import { BulkUpdateSubjectStatusRequestDto } from '../../application/dtos/bulk-update-subject-status.request.dto';
import { CopyAttendanceRequestDto } from '../../application/dtos/copy-attendance.request.dto';
import { JustifyAttendanceRequestDto } from '../../application/dtos/justify-attendance.request.dto';
import { RegisterDailyAttendanceRequestDto } from '../../application/dtos/register-daily-attendance.request.dto';
import { RegisterSubjectAttendanceRequestDto } from '../../application/dtos/register-subject-attendance.request.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceCommandController {
	constructor(
		private readonly registerDailyAttendanceHandler: RegisterDailyAttendanceHandler,
		private readonly bulkRegisterAttendanceHandler: BulkRegisterAttendanceHandler,
		private readonly justifyAttendanceHandler: JustifyAttendanceHandler,
		private readonly bulkUpdateSubjectStatusHandler: BulkUpdateSubjectStatusHandler,
		private readonly registerSubjectAttendanceHandler: RegisterSubjectAttendanceHandler,
		private readonly copyAttendanceHandler: CopyAttendanceHandler,
	) {}

	@Post('daily')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async registerDaily(
		@Body() dto: RegisterDailyAttendanceRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.registerDailyAttendanceHandler.execute(
			new RegisterDailyAttendanceCommand(
				user.tenantId,
				dto.courseId,
				new Date(dto.date),
				dto.records.map((r) => ({ studentId: r.studentId, status: r.status })),
				user.sub,
			),
		);
	}

	@Post('daily/all')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async bulkRegister(
		@Body() dto: BulkRegisterAttendanceRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.bulkRegisterAttendanceHandler.execute(
			new BulkRegisterAttendanceCommand(
				user.tenantId,
				dto.courseId,
				new Date(dto.date),
				dto.defaultStatus,
				user.sub,
			),
		);
	}

	@Post(':id/justify')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async justify(
		@Param('id') id: string,
		@Body() dto: JustifyAttendanceRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.justifyAttendanceHandler.execute(
			new JustifyAttendanceCommand(id, dto.reason, user.sub, dto.notes),
		);
	}
	@Post('subject')
	@RolesDecorator(ROLES.TEACHER, ROLES.ADMIN)
	async registerSubjectAttendance(
		@Body() dto: RegisterSubjectAttendanceRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.registerSubjectAttendanceHandler.execute(
			new RegisterSubjectAttendanceCommand(
				user.tenantId,
				user.sub,
				dto.subjectId,
				dto.courseId,
				new Date(dto.date),
				dto.records,
			),
		);
	}

	@Post('subject/all')
	@RolesDecorator(ROLES.TEACHER, ROLES.ADMIN)
	async bulkUpdateSubjectStatus(
		@Body() dto: BulkUpdateSubjectStatusRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.bulkUpdateSubjectStatusHandler.execute(
			new BulkUpdateSubjectStatusCommand(
				user.sub,
				user.tenantId,
				dto.subjectId,
				new Date(dto.date),
				dto.status,
			),
		);
	}

	@Post('subject/copy')
	@RolesDecorator(ROLES.TEACHER, ROLES.ADMIN)
	async copyAttendance(
		@Body() dto: CopyAttendanceRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.copyAttendanceHandler.execute(
			new CopyAttendanceCommand(
				user.sub,
				dto.subjectId,
				new Date(dto.targetDate),
				dto.sourceDate ? new Date(dto.sourceDate) : undefined,
			),
		);
	}
}
