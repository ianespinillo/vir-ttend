import { Module } from '@nestjs/common';
import { AcademicModule } from '../academic/academic.module';
import { AcademicPersistenceModule } from '../academic/infrastructure/persistence/academic.persistence.module';
import { AttendancePersistenceModule } from '../attendance/infrastructure/persistence/attendance.persistence.module';
import { GenerateMonthlyReportHandler } from './application/commands/generate-monthly-report/generate-monthly-report.handler';
import { GenerateStudentReportHandler } from './application/commands/generate-student-report/generate-student-report.handler';
import { GetCourseSummaryQueryHandler } from './application/queries/get-course-summary/get-course-summary.handler';
import { GetMonthlyReportQueryHandler } from './application/queries/get-monthly-report/get-monthly-report.handler';
import { GetReportsByCourseQueryHandler } from './application/queries/get-reports-by-course/get-reports-by-course.handler';
import { GetStudentReportQueryHandler } from './application/queries/get-student-report/get-student-report.handler';
import { ReportGenerationService } from './application/services/report-generation.service';
import { AcademicYearAdapter } from './infrastructure/adapters/academic-year.adapter';
import { AttendanceAlertAdapter } from './infrastructure/adapters/attendance-alert.adapter';
import { AttendanceRecordAdapter } from './infrastructure/adapters/attendance-record.adapter';
import { CourseAdapter } from './infrastructure/adapters/course.adapter';
import { StudentAdapter } from './infrastructure/adapters/student.adapter';
import { ReportingPersistenceModule } from './infrastructure/persistence/reporting.persistence.module';
import { ReportRepository } from './infrastructure/persistence/repositories/report.repository';
import { ReportingPresentationModule } from './presentation/reporting.presentation.module';

const adapters = [
	StudentAdapter,
	CourseAdapter,
	AcademicYearAdapter,
	AttendanceRecordAdapter,
	AttendanceAlertAdapter,
];

const portTokens = [
	{ provide: 'IStudentPort', useClass: StudentAdapter },
	{ provide: 'ICoursePort', useClass: CourseAdapter },
	{ provide: 'IAcademicYearPort', useClass: AcademicYearAdapter },
	{ provide: 'IAttendanceRecordPort', useClass: AttendanceRecordAdapter },
	{ provide: 'IAttendanceAlertPort', useClass: AttendanceAlertAdapter },
];

const handlers = [
	GenerateMonthlyReportHandler,
	GenerateStudentReportHandler,
	GetMonthlyReportQueryHandler,
	GetStudentReportQueryHandler,
	GetReportsByCourseQueryHandler,
	GetCourseSummaryQueryHandler,
];

const services = [ReportGenerationService];

@Module({
	imports: [
		AcademicModule,
		AcademicPersistenceModule,
		AttendancePersistenceModule,
		ReportingPersistenceModule,
		ReportingPresentationModule,
	],
	providers: [
		...adapters,
		...portTokens,
		{ provide: 'IReportRepository', useClass: ReportRepository },
		...handlers,
		...services,
	],
})
export class ReportingModule {}
