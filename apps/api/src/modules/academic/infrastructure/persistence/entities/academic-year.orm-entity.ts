import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '../../../../shared/database/entities/base.entity';
import { AcademicYearRepository } from '../repositories/academic-year.repository';

@Entity({
	tableName: 'academic_years',
	repository: () => AcademicYearRepository,
})
export class AcademicYearOrmEntity extends BaseEntity {
	@Property()
	schoolId!: string;

	@Property()
	year!: number;

	@Property()
	startDate!: Date;

	@Property()
	endDate!: Date;

	@Property()
	isActive!: boolean;

	@Property({ type: 'json' })
	nonWorkingDays!: Date[];

	@Property()
	absenceThresholdPercent!: number;

	@Property()
	lateCountAbscenseAfterMinutes!: number;
}
