import { Module } from '@nestjs/common';
import { ExportController } from './controllers/export.controller';
import { ReportsController } from './controllers/reports.controller';
import { StudentReportsController } from './controllers/student-reports.controller';

@Module({
	controllers: [ReportsController, StudentReportsController, ExportController],
})
export class ReportingPresentationModule {}
