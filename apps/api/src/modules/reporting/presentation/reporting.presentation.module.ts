import { Module } from '@nestjs/common';
import { ReportsController } from './controllers/reports.controller';
import { StudentReportsController } from './controllers/student-reports.controller';

@Module({
	controllers: [ReportsController, StudentReportsController],
})
export class ReportingPresentationModule {}
