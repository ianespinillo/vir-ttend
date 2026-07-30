import { EntityRepository } from '@mikro-orm/postgresql';
import { MonthlyReport } from '../../../domain/entities/monthly-report.entity';
import { IReportRepository } from '../../../domain/repositories/report.repository.interface';
import { ReportPeriod } from '../../../domain/value-objects/report-period.vo';
import { MonthlyReportOrmEntity } from '../entities/monthly-report.orm-entity';
import { ReportMapper } from '../mappers/report.mapper';

export class ReportRepository
	extends EntityRepository<MonthlyReportOrmEntity>
	implements IReportRepository
{
	async findByCourseAndPeriod(
		courseId: string,
		period: ReportPeriod,
	): Promise<MonthlyReport | null> {
		const orm = await this.findOne({
			courseId,
			month: period.month,
			year: period.year,
		});
		if (!orm) return null;
		return ReportMapper.toDomain(orm);
	}

	async findByCourse(courseId: string): Promise<MonthlyReport[]> {
		const orms = await this.find(
			{ courseId },
			{ orderBy: { year: 'ASC', month: 'ASC' } },
		);
		return orms.map(ReportMapper.toDomain);
	}

	async save(report: MonthlyReport): Promise<void> {
		const existing = await this.findOne({ id: report.id });
		if (existing) {
			this.em.assign(existing, ReportMapper.toOrm(report));
		} else {
			this.em.persist(ReportMapper.toOrm(report));
		}
		await this.em.flush();
	}
}
