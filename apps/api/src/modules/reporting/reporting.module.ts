import { Module } from '@nestjs/common';
import { AcademicPersistenceModule } from '../academic/infrastructure/persistence/academic.persistence.module';
import { AttendancePersistenceModule } from '../attendance/infrastructure/persistence/attendance.persistence.module';
import { IdentityPersistenceModule } from '../identity/infrastructure/persistence/identity.persistence.module';
import { ExportExcelHandler } from './application/commands/export-excel/export-excel.handler';
import { ExportPdfHandler } from './application/commands/export-pdf/export-pdf.handler';
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
import { TenantAdapter } from './infrastructure/adapters/tenant.adapter';
import { ReportingPersistenceModule } from './infrastructure/persistence/reporting.persistence.module';
import { ExcelGeneratorService } from './infrastructure/services/excel-generator.service';
import { PdfGeneratorService } from './infrastructure/services/pdf-generator.service';
import { ExportController } from './presentation/controllers/export.controller';
import { ReportsController } from './presentation/controllers/reports.controller';
import { StudentReportsController } from './presentation/controllers/student-reports.controller';

const adapters = [
	StudentAdapter,
	CourseAdapter,
	AcademicYearAdapter,
	AttendanceRecordAdapter,
	AttendanceAlertAdapter,
	TenantAdapter,
];

const portTokens = [
	{ provide: 'IStudentPort', useClass: StudentAdapter },
	{ provide: 'ICoursePort', useClass: CourseAdapter },
	{ provide: 'IAcademicYearPort', useClass: AcademicYearAdapter },
	{ provide: 'IAttendanceRecordPort', useClass: AttendanceRecordAdapter },
	{ provide: 'IAttendanceAlertPort', useClass: AttendanceAlertAdapter },
	{ provide: 'ITenantPort', useClass: TenantAdapter },
];

const handlers = [
	GenerateMonthlyReportHandler,
	GenerateStudentReportHandler,
	GetMonthlyReportQueryHandler,
	GetStudentReportQueryHandler,
	GetReportsByCourseQueryHandler,
	GetCourseSummaryQueryHandler,
	ExportExcelHandler,
	ExportPdfHandler,
];

const services = [ReportGenerationService];

@Module({
	imports: [
		AcademicPersistenceModule,
		AttendancePersistenceModule,
		IdentityPersistenceModule,
		ReportingPersistenceModule,
	],
	providers: [
		...adapters,
		...portTokens,
		{ provide: 'IExcelGeneratorService', useClass: ExcelGeneratorService },
		{ provide: 'IPdfGeneratorService', useClass: PdfGeneratorService },
		...handlers,
		...services,
	],
	controllers: [ReportsController, StudentReportsController, ExportController],
})
export class ReportingModule {}
