import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { MonthlyReportOrmEntity } from './entities/monthly-report.orm-entity';
import { ReportRepository } from './repositories/report.repository';

@Module({
	imports: [MikroOrmModule.forFeature([MonthlyReportOrmEntity])],
	providers: [ReportRepository],
	exports: [ReportRepository],
})
export class ReportingPersistenceModule {}
