import { Module } from '@nestjs/common';
import { AcademicModule } from '../academic/academic.module';
import { BulkRegisterAttendanceHandler } from './application/commands/bulk-register-attendance/bulk-register-attendance.handler';
import { BulkUpdateSubjectStatusHandler } from './application/commands/bulk-update-subject-status/bulk-update-subject-status.handler';
import { CopyAttendanceHandler } from './application/commands/copy-attendance/copy-attendance.handler';
import { GenerateAlertHandler } from './application/commands/generate-alert/generate-alert.handler';
import { JustifyAttendanceHandler } from './application/commands/justify-attendance/justify-attendance.handler';
import { MarkAlertSeenHandler } from './application/commands/mark-alert-seen/mark-alert-seen.handler';
import { RegisterDailyAttendanceHandler } from './application/commands/register-daily-attendance/register-daily-attendance.handler';
import { RegisterSubjectAttendanceHandler } from './application/commands/register-subject-attendance/register-subject-attendance.handler';
import { GetAlertsCountQueryHandler } from './application/queries/get-alerts-count/get-alerts-count.handler';
import { GetAlertsQueryHandler } from './application/queries/get-alerts/get-alerts.handler';
import { GetAttendanceByStudentQueryHandler } from './application/queries/get-attendance-by-student/get-attendance-by-student.handler';
import { GetAttendanceHistoryQueryHandler } from './application/queries/get-attendance-history/get-attendance-history.handler';
import { GetAttendanceMetricsQueryHandler } from './application/queries/get-attendance-metrics/get-attendance-metrics.handler';
import { GetCourseDailyOverviewQueryHandler } from './application/queries/get-course-daily-overview/get-course-daily-overview.handler';
import { GetDailyAttendanceQueryHandler } from './application/queries/get-daily-attendance/get-daily-attendance.handler';
import { GetDashboardMetricsQueryHandler } from './application/queries/get-dashboard-metrics/get-dashboard-metrics.handler';
import { GetPreceptorDashboardQueryHandler } from './application/queries/get-preceptor-dashboard/get-preceptor-dashboard.handler';
import { GetStudentAlertsQueryHandler } from './application/queries/get-student-alerts/get-student-alerts.handler';
import { GetSubjectAttendanceQueryHandler } from './application/queries/get-subject-attendance/get-subject-attendance.handler';
import { GetSubjectHistoryQueryHandler } from './application/queries/get-subject-history/get-subject-history.handler';
import { GetUnseenAlertsQueryHandler } from './application/queries/get-unseen-alerts/get-unseen-alerts.handler';
import { CourseSnapshotBuilderService } from './application/services/course-snapshot-builder.service';
import { AttendanceCalculationService } from './domain/services/attendance-calculation.service';
import { AttendanceCopyService } from './domain/services/attendance-copy.service';
import { LatePolicyService } from './domain/services/late-policy.service';
import { AcademicYearAdapter } from './infrastructure/adapters/academic-year.adapter';
import { CourseAdapter } from './infrastructure/adapters/course.adapter';
import { ScheduleAdapter } from './infrastructure/adapters/schedule.adapter';
import { StudentAdapter } from './infrastructure/adapters/student.adapter';
import { SubjectAdapter } from './infrastructure/adapters/subject.adapter';
import { AttendancePersistenceModule } from './infrastructure/persistence/attendance.persistence.module';
import { AttendanceAlertRepository } from './infrastructure/persistence/repository/attendance-alert.repository';
import { AttendanceRecordRepository } from './infrastructure/persistence/repository/attendance-record.repository';
import { JustificationRepository } from './infrastructure/persistence/repository/justification.repository';
import { AlertsController } from './presentation/controllers/alerts.controller';
import { AttendanceCommandController } from './presentation/controllers/attendance.command.controller';
import { AttendanceQueryController } from './presentation/controllers/attendance.query.controller';
import { DashboardController } from './presentation/controllers/dashboard.controller';

@Module({
	imports: [AcademicModule, AttendancePersistenceModule],
	providers: [
		{
			provide: 'IStudentPort',
			useClass: StudentAdapter,
		},
		{
			provide: 'IAcademicYearPort',
			useClass: AcademicYearAdapter,
		},
		{
			provide: 'ICoursePort',
			useClass: CourseAdapter,
		},
		{
			provide: 'ISchedulePort',
			useClass: ScheduleAdapter,
		},
		{
			provide: 'ISubjectPort',
			useClass: SubjectAdapter,
		},
		{
			provide: 'IAttendanceRecordRepository',
			useClass: AttendanceRecordRepository,
		},
		{
			provide: 'IAttendanceAlertRepository',
			useClass: AttendanceAlertRepository,
		},
		{
			provide: 'IJustificationRepository',
			useClass: JustificationRepository,
		},
		//commands
		RegisterDailyAttendanceHandler,
		RegisterSubjectAttendanceHandler,
		BulkRegisterAttendanceHandler,
		BulkUpdateSubjectStatusHandler,
		JustifyAttendanceHandler,
		CopyAttendanceHandler,
		GenerateAlertHandler,
		MarkAlertSeenHandler,
		//queries
		GetDailyAttendanceQueryHandler,
		GetDailyAttendanceQueryHandler,
		GetAttendanceByStudentQueryHandler,
		GetAttendanceHistoryQueryHandler,
		GetAttendanceMetricsQueryHandler,
		GetSubjectAttendanceQueryHandler,
		GetSubjectHistoryQueryHandler,
		GetDashboardMetricsQueryHandler,
		GetPreceptorDashboardQueryHandler,
		GetCourseDailyOverviewQueryHandler,
		GetAlertsQueryHandler,
		GetUnseenAlertsQueryHandler,
		GetAlertsCountQueryHandler,
		GetStudentAlertsQueryHandler,
		//domain services
		AttendanceCalculationService,
		AttendanceCopyService,
		LatePolicyService,
		CourseSnapshotBuilderService,
	],
	controllers: [
		AlertsController,
		AttendanceCommandController,
		AttendanceQueryController,
		DashboardController,
	],
})
export class AttendanceModule {}
