import { Module } from '@nestjs/common';
import { AcademicModule } from '../academic/academic.module';
import { BulkRegisterAttendanceHandler } from './application/commands/bulk-register-attendance/bulk-register-attendance.handler';
import { BulkUpdateSubjectStatusHandler } from './application/commands/bulk-update-subject-status/bulk-update-subject-status.handler';
import { CopyAttendanceHandler } from './application/commands/copy-attendance/copy-attendance.handler';
import { JustifyAttendanceHandler } from './application/commands/justify-attendance/justify-attendance.handler';
import { RegisterDailyAttendanceHandler } from './application/commands/register-daily-attendance/register-daily-attendance.handler';
import { RegisterSubjectAttendanceHandler } from './application/commands/register-subject-attendance/register-subject-attendance.handler';
import { GetAttendanceHistoryQueryHandler } from './application/queries/get-attendance-history/get-attendance-history.handler';
import { GetAttendanceMetricsQueryHandler } from './application/queries/get-attendance-metrics/get-attendance-metrics.handler';
import { GetDailyAttendanceQueryHandler } from './application/queries/get-daily-attendance/get-daily-attendance.handler';
import { GetSubjectAttendanceQueryHandler } from './application/queries/get-subject-attendance/get-subject-attendance.handler';
import { GetSubjectHistoryQueryHandler } from './application/queries/get-subject-history/get-subject-history.handler';
import { AcademicYearAdapter } from './infrastructure/adapters/academic-year.adapter';
import { StudentAdapter } from './infrastructure/adapters/student.adapter';
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
		RegisterSubjectAttendanceHandler,
		BulkRegisterAttendanceHandler,
		BulkUpdateSubjectStatusHandler,
		JustifyAttendanceHandler,
		CopyAttendanceHandler,
		//queries
		GetDailyAttendanceQueryHandler,
		GetDailyAttendanceQueryHandler,
		GetAttendanceHistoryQueryHandler,
		GetAttendanceMetricsQueryHandler,
		GetSubjectAttendanceQueryHandler,
		GetSubjectHistoryQueryHandler,
	],
})
export class AttendanceModule {}
