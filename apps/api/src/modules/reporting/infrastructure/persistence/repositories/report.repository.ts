import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../../shared/cache/cache.module';
import { MonthlyReport } from '../../../domain/entities/monthly-report.entity';
import { IReportRepository } from '../../../domain/repositories/report.repository.interface';
import { IMonthlyReportData } from '../../../domain/types/monthly-report-data.type';
import { MonthlyReportData } from '../../../domain/value-objects/monthly-report-data.vo';
import { ReportPeriod } from '../../../domain/value-objects/report-period.vo';
import { MonthlyReportOrmEntity } from '../entities/monthly-report.orm-entity';
import { ReportMapper } from '../mappers/report.mapper';

interface ReportCachePayload {
	id: string;
	tenantId: string;
	courseId: string;
	academicYearId: string;
	month: number;
	year: number;
	data: IMonthlyReportData;
	generatedAt: string;
	createdAt: string;
}

export class ReportRepository
	extends EntityRepository<MonthlyReportOrmEntity>
	implements IReportRepository
{
	constructor(
		em: EntityManager,
		@Inject(REDIS_CLIENT) private readonly redis: Redis,
	) {
		super(em, MonthlyReportOrmEntity);
	}

	async findByCourseAndPeriod(
		courseId: string,
		period: ReportPeriod,
	): Promise<MonthlyReport | null> {
		const cacheKey = this.cacheKey(courseId, period.month, period.year);
		const cached = await this.safeGet(cacheKey);
		if (cached) {
			return this.hydrate(JSON.parse(cached));
		}

		const orm = await this.findOne({
			courseId,
			month: period.month,
			year: period.year,
		});

		if (orm) {
			await this.safeSet(cacheKey, JSON.stringify(this.dehydrate(orm)), 3600);
			return ReportMapper.toDomain(orm);
		}
		return null;
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

		await this.safeDel(this.cacheKey(report.courseId, report.month, report.year));
	}

	private cacheKey(courseId: string, month: number, year: number): string {
		return `report:${courseId}:${year}:${month}`;
	}

	private dehydrate(orm: MonthlyReportOrmEntity): ReportCachePayload {
		return {
			id: orm.id,
			tenantId: orm.tenantId,
			courseId: orm.courseId,
			academicYearId: orm.academicYearId,
			month: orm.month,
			year: orm.year,
			data: orm.data,
			generatedAt: orm.generatedAt.toISOString(),
			createdAt: orm.createdAt.toISOString(),
		};
	}

	private hydrate(raw: ReportCachePayload): MonthlyReport {
		return MonthlyReport.reconstitute({
			id: raw.id,
			tenantId: raw.tenantId,
			courseId: raw.courseId,
			academicYearId: raw.academicYearId,
			month: raw.month,
			year: raw.year,
			data: MonthlyReportData.fromData(raw.data),
			generatedAt: new Date(raw.generatedAt),
			createdAt: new Date(raw.createdAt),
		});
	}

	private async safeGet(key: string): Promise<string | null> {
		try {
			return await this.redis.get(key);
		} catch {
			return null;
		}
	}

	private async safeSet(key: string, value: string, ttl: number): Promise<void> {
		try {
			await this.redis.set(key, value, 'EX', ttl);
		} catch {
			// cache best-effort
		}
	}

	private async safeDel(key: string): Promise<void> {
		try {
			await this.redis.del(key);
		} catch {
			// cache best-effort
		}
	}
}
