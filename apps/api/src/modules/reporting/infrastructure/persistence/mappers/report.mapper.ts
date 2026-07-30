import { MonthlyReport } from '../../../domain/entities/monthly-report.entity';
import { MonthlyReportData } from '../../../domain/value-objects/monthly-report-data.vo';
import { MonthlyReportOrmEntity } from '../entities/monthly-report.orm-entity';

export class ReportMapper {
	static toDomain(orm: MonthlyReportOrmEntity): MonthlyReport {
		return MonthlyReport.reconstitute({
			id: orm.id,
			tenantId: orm.tenantId,
			courseId: orm.courseId,
			academicYearId: orm.academicYearId,
			month: orm.month,
			year: orm.year,
			data: MonthlyReportData.fromData(orm.data),
			generatedAt: orm.generatedAt,
			createdAt: orm.createdAt,
		});
	}

	static toOrm(entity: MonthlyReport): MonthlyReportOrmEntity {
		const orm = new MonthlyReportOrmEntity();
		orm.id = entity.id;
		orm.tenantId = entity.tenantId;
		orm.courseId = entity.courseId;
		orm.academicYearId = entity.academicYearId;
		orm.month = entity.month;
		orm.year = entity.year;
		orm.data = entity.data.toJSON;
		orm.generatedAt = entity.generatedAt;
		return orm;
	}
}
