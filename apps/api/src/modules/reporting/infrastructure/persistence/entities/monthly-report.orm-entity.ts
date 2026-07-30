import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { BaseEntity } from '../../../../shared/database/entities/base.entity';
import { IMonthlyReportData } from '../../../domain/types/monthly-report-data.type';

@Entity({ tableName: 'monthly_reports' })
@Unique({ properties: ['courseId', 'month', 'year'] })
@Index({ properties: ['courseId'] })
export class MonthlyReportOrmEntity extends BaseEntity {
	@Property({ type: 'uuid' })
	tenantId!: string;

	@Property({ type: 'uuid' })
	courseId!: string;

	@Property({ type: 'uuid' })
	academicYearId!: string;

	@Property({ type: 'smallint' })
	month!: number;

	@Property({ type: 'smallint' })
	year!: number;

	@Property({ type: 'jsonb' })
	data!: IMonthlyReportData;

	@Property({ type: 'timestamp' })
	generatedAt!: Date;
}
