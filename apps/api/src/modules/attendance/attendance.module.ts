import { Module } from '@nestjs/common';
import { AcademicModule } from '../academic/academic.module';
import { AcademicYearAdapter } from '../academic/infrastructure/adapters/academic-year.adapter';
import { StudentAdapter } from '../academic/infrastructure/adapters/student.adapter';
import { BulkRegisterAttendanceHandler } from './application/commands/bulk-register-attendance/bulk-register-attendance.handler';
import { JustifyAttendanceHandler } from './application/commands/justify-attendance/justify-attendance.handler';
import { RegisterDailyAttendanceHandler } from './application/commands/register-daily-attendance/register-daily-attendance.handler';
import { GetAttendanceHistoryQueryHandler } from './application/queries/get-attendance-history/get-attendance-history.handler';
import { GetAttendanceMetricsQueryHandler } from './application/queries/get-attendance-metrics/get-attendance-metrics.handler';
import { GetDailyAttendanceQueryHandler } from './application/queries/get-daily-attendance/get-daily-attendance.handler';
import { AttendancePersistenceModule } from './infrastructure/persistence/attendance.persistence.module';

@Module({
	imports: [AcademicModule, AttendancePersistenceModule],
	providers: [
		{
			provide: 'IStudentPort',
			useClass: StudentAdapter,
		},
		{
			provide: 'IAcadmicYearPort',
			useClass: AcademicYearAdapter,
		},
		//commands
		RegisterDailyAttendanceHandler,
		BulkRegisterAttendanceHandler,
		JustifyAttendanceHandler,
		//queries
		GetDailyAttendanceQueryHandler,
		GetDailyAttendanceQueryHandler,
		GetAttendanceHistoryQueryHandler,
		GetAttendanceMetricsQueryHandler,
	],
})
export class AttendanceModule {}
