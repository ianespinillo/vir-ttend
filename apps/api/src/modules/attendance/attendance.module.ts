import { Module } from '@nestjs/common';
import { AcademicModule } from '../academic/academic.module';
import { AcademicPersistenceModule } from '../academic/infrastructure/persistence/academic.persistence.module';
import { BulkJustifyAttendanceHandler } from './application/commands/bulk-justify-attendance/bulk-justify-attendance.handler';
import { BulkJustifyWorkshopAttendanceHandler } from './application/commands/bulk-justify-workshop-attendance/bulk-justify-workshop-attendance.handler';
import { BulkRegisterAttendanceHandler } from './application/commands/bulk-register-attendance/bulk-register-attendance.handler';
import { BulkRegisterWorkshopAttendanceHandler } from './application/commands/bulk-register-workshop-attendance/bulk-register-workshop-attendance.handler';
import { BulkUpdateSubjectStatusHandler } from './application/commands/bulk-update-subject-status/bulk-update-subject-status.handler';
import { CopyAttendanceHandler } from './application/commands/copy-attendance/copy-attendance.handler';
import { CopyDailyAttendanceHandler } from './application/commands/copy-daily-attendance/copy-daily-attendance.handler';
import { GenerateAlertHandler } from './application/commands/generate-alert/generate-alert.handler';
import { JustifyAttendanceHandler } from './application/commands/justify-attendance/justify-attendance.handler';
import { JustifyWorkshopAttendanceHandler } from './application/commands/justify-workshop-attendance/justify-workshop-attendance.handler';
import { MarkAlertSeenHandler } from './application/commands/mark-alert-seen/mark-alert-seen.handler';
import { MarkDailySessionNotHeldHandler } from './application/commands/mark-daily-session-not-held/mark-daily-session-not-held.handler';
import { MarkWorkshopSessionNotHeldHandler } from './application/commands/mark-workshop-session-not-held/mark-workshop-session-not-held.handler';
import { RegisterDailyAttendanceHandler } from './application/commands/register-daily-attendance/register-daily-attendance.handler';
import { RegisterSubjectAttendanceHandler } from './application/commands/register-subject-attendance/register-subject-attendance.handler';
import { RegisterWorkshopAttendanceHandler } from './application/commands/register-workshop-attendance/register-workshop-attendance.handler';
import { UnmarkDailySessionNotHeldHandler } from './application/commands/unmark-daily-session-not-held/unmark-daily-session-not-held.handler';
import { UnmarkWorkshopSessionNotHeldHandler } from './application/commands/unmark-workshop-session-not-held/unmark-workshop-session-not-held.handler';
import { GetAlertsCountQueryHandler } from './application/queries/get-alerts-count/get-alerts-count.handler';
import { GetAlertsQueryHandler } from './application/queries/get-alerts/get-alerts.handler';
import { GetAttendanceByStudentQueryHandler } from './application/queries/get-attendance-by-student/get-attendance-by-student.handler';
import { GetAttendanceHistoryQueryHandler } from './application/queries/get-attendance-history/get-attendance-history.handler';
import { GetAttendanceMetricsQueryHandler } from './application/queries/get-attendance-metrics/get-attendance-metrics.handler';
import { GetCourseDailyOverviewQueryHandler } from './application/queries/get-course-daily-overview/get-course-daily-overview.handler';
import { GetDailyAttendanceQueryHandler } from './application/queries/get-daily-attendance/get-daily-attendance.handler';
import { GetDailySessionNotHeldQueryHandler } from './application/queries/get-daily-session-not-held/get-daily-session-not-held.handler';
import { GetDashboardMetricsQueryHandler } from './application/queries/get-dashboard-metrics/get-dashboard-metrics.handler';
import { GetMyWorkshopCommissionsQueryHandler } from './application/queries/get-my-workshop-commissions/get-my-workshop-commissions.handler';
import { GetPreceptorDashboardQueryHandler } from './application/queries/get-preceptor-dashboard/get-preceptor-dashboard.handler';
import { GetStudentAlertsQueryHandler } from './application/queries/get-student-alerts/get-student-alerts.handler';
import { GetSubjectAttendanceQueryHandler } from './application/queries/get-subject-attendance/get-subject-attendance.handler';
import { GetSubjectHistoryQueryHandler } from './application/queries/get-subject-history/get-subject-history.handler';
import { GetUnseenAlertsQueryHandler } from './application/queries/get-unseen-alerts/get-unseen-alerts.handler';
import { GetWorkshopAttendanceQueryHandler } from './application/queries/get-workshop-attendance/get-workshop-attendance.handler';
import { GetWorkshopSessionNotHeldQueryHandler } from './application/queries/get-workshop-session-not-held/get-workshop-session-not-held.handler';
import { AttendanceCalculationService } from './application/services/attendance-calculation.service';
import { AttendanceCopyService } from './application/services/attendance-copy.service';
import { CourseSnapshotBuilderService } from './application/services/course-snapshot-builder.service';
import { StudentWeightedAbsencesService } from './application/services/student-weighted-absences.service';
import { SubjectRosterService } from './application/services/subject-roster.service';
import { AcademicYearAdapter } from './infrastructure/adapters/academic-year.adapter';
import { CourseAdapter } from './infrastructure/adapters/course.adapter';
import { ScheduleAdapter } from './infrastructure/adapters/schedule.adapter';
import { StudentAdapter } from './infrastructure/adapters/student.adapter';
import { SubjectAdapter } from './infrastructure/adapters/subject.adapter';
import { MikroOrmUnitOfWorkAdapter } from './infrastructure/adapters/unit-of-work.adapter';
import { WorkshopCommissionAdapter } from './infrastructure/adapters/workshop-commission.adapter';
import { AlertTriggeredListener } from './infrastructure/events/alert-triggered.listener';
import { AttendanceRegisteredListener } from './infrastructure/events/attendance-registered.listener';
import { AttendancePersistenceModule } from './infrastructure/persistence/attendance.persistence.module';
import { AlertsController } from './presentation/controllers/alerts.controller';
import { AttendanceCommandController } from './presentation/controllers/attendance.command.controller';
import { AttendanceQueryController } from './presentation/controllers/attendance.query.controller';
import { DashboardController } from './presentation/controllers/dashboard.controller';
import { WorkshopAttendanceController } from './presentation/controllers/workshop-attendance.controller';

@Module({
	imports: [
		AcademicModule,
		AcademicPersistenceModule,
		AttendancePersistenceModule,
	],
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
			provide: 'IUnitOfWorkPort',
			useClass: MikroOrmUnitOfWorkAdapter,
		},
		{
			provide: 'IWorkshopCommissionPort',
			useClass: WorkshopCommissionAdapter,
		},
		//commands
		RegisterWorkshopAttendanceHandler,
		BulkRegisterWorkshopAttendanceHandler,
		RegisterDailyAttendanceHandler,
		RegisterSubjectAttendanceHandler,
		BulkRegisterAttendanceHandler,
		BulkUpdateSubjectStatusHandler,
		JustifyAttendanceHandler,
		BulkJustifyAttendanceHandler,
		BulkJustifyWorkshopAttendanceHandler,
		JustifyWorkshopAttendanceHandler,
		CopyAttendanceHandler,
		CopyDailyAttendanceHandler,
		GenerateAlertHandler,
		MarkAlertSeenHandler,
		MarkDailySessionNotHeldHandler,
		UnmarkDailySessionNotHeldHandler,
		MarkWorkshopSessionNotHeldHandler,
		UnmarkWorkshopSessionNotHeldHandler,
		//queries
		GetWorkshopAttendanceQueryHandler,
		GetWorkshopSessionNotHeldQueryHandler,
		GetMyWorkshopCommissionsQueryHandler,
		GetDailyAttendanceQueryHandler,
		GetDailySessionNotHeldQueryHandler,
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
		CourseSnapshotBuilderService,
		StudentWeightedAbsencesService,
		SubjectRosterService,
		//event listeners
		AttendanceRegisteredListener,
		AlertTriggeredListener,
	],
	controllers: [
		AlertsController,
		AttendanceCommandController,
		AttendanceQueryController,
		DashboardController,
		WorkshopAttendanceController,
	],
})
export class AttendanceModule {}
