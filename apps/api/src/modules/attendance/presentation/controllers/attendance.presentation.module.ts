import { Module } from '@nestjs/common';
import { AttendanceCommandController } from './attendance.command.controller';
import { AttendanceQueryController } from './attendance.query.controller';
import { DashboardController } from './dashboard.controller';

@Module({
	controllers: [
		AttendanceCommandController,
		AttendanceQueryController,
		DashboardController,
	],
})
export class CourseController {}
