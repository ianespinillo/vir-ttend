import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { MonthlyReportOrmEntity } from './entities/monthly-report.orm-entity';
import { ReportRepository } from './repositories/report.repository';

@Module({
	imports: [MikroOrmModule.forFeature([MonthlyReportOrmEntity])],
	providers: [
		ReportRepository,
		{
			provide: 'IReportRepository',
			useExisting: ReportRepository,
		},
	],
	exports: [ReportRepository, 'IReportRepository'],
})
export class ReportingPersistenceModule {}
