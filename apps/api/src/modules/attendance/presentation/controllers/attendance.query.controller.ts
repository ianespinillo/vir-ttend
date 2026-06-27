import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ROLES } from '@repo/common';
// attendance-query.controller.ts
import { RolesDecorator } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guard/roles.guard';
import { GetAttendanceByStudentQueryHandler } from '../../application/queries/get-attendance-by-student/get-attendance-by-student.handler';
import { GetAttendanceByStudentQuery } from '../../application/queries/get-attendance-by-student/get-attendance-by-student.query';
import { GetAttendanceHistoryQueryHandler } from '../../application/queries/get-attendance-history/get-attendance-history.handler';
import { GetAttendanceHistoryQuery } from '../../application/queries/get-attendance-history/get-attendance-history.query';
import { GetAttendanceMetricsQueryHandler } from '../../application/queries/get-attendance-metrics/get-attendance-metrics.handler';
import { GetAttendanceMetricsQuery } from '../../application/queries/get-attendance-metrics/get-attendance-metrics.query';
import { GetDailyAttendanceQueryHandler } from '../../application/queries/get-daily-attendance/get-daily-attendance.handler';
import { GetDailyAttendanceQuery } from '../../application/queries/get-daily-attendance/get-daily-attendance.query';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceQueryController {
	constructor(
		private readonly getDailyAttendanceHandler: GetDailyAttendanceQueryHandler,
		private readonly getAttendanceMetricsHandler: GetAttendanceMetricsQueryHandler,
		private readonly getAttendanceByStudentHandler: GetAttendanceByStudentQueryHandler,
		private readonly getAttendanceHistoryHandler: GetAttendanceHistoryQueryHandler,
	) {}

	@Get('daily')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getDaily(
		@Query('courseId') courseId: string,
		@Query('date') date: string,
	) {
		return this.getDailyAttendanceHandler.execute(
			new GetDailyAttendanceQuery(courseId, new Date(date)),
		);
	}

	@Get('metrics')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getMetrics(
		@Query('courseId') courseId: string,
		@Query('date') date: string,
	) {
		return this.getAttendanceMetricsHandler.execute(
			new GetAttendanceMetricsQuery(courseId, new Date(date)),
		);
	}

	@Get('student/:studentId')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getByStudent(
		@Param('studentId') studentId: string,
		@Query('from') from: string,
		@Query('to') to: string,
	) {
		return this.getAttendanceByStudentHandler.execute(
			new GetAttendanceByStudentQuery(studentId, new Date(from), new Date(to)),
		);
	}

	@Get('history')
	@RolesDecorator(ROLES.PRECEPTOR, ROLES.ADMIN)
	async getHistory(
		@Query('courseId') courseId: string,
		@Query('from') from: string,
		@Query('to') to: string,
	) {
		return this.getAttendanceHistoryHandler.execute(
			new GetAttendanceHistoryQuery(courseId, new Date(from), new Date(to)),
		);
	}
}
