import { AcademicYear } from '../../../domain/entities/academic-year.entity';
import { AcademicYearOrmEntity } from '../entities/academic-year.orm-entity';

export class AcademicYearMapper {
	static toOrm(entity: AcademicYear): AcademicYearOrmEntity {
		const ormEntity = new AcademicYearOrmEntity();
		ormEntity.id = entity.id.getRaw();
		ormEntity.schoolId = entity.tenantId;
		ormEntity.year = entity.year;
		ormEntity.startDate = entity.startDate;
		ormEntity.endDate = entity.endDate;
		ormEntity.isActive = entity.isActive;
		ormEntity.nonWorkingDays = entity.nonWorkingDays;
		ormEntity.absenceThresholdPercent = entity.absenceThresholdPercent;
		ormEntity.lateCountAbscenseAfterMinutes =
			entity.lateCountAbscenseAfterMinutes;
		ormEntity.createdAt = entity.createdAt;
		ormEntity.updatedAt = entity.updatedAt;
		return ormEntity;
	}
	static toDomain(ormEntity: AcademicYearOrmEntity): AcademicYear {
		return AcademicYear.reconstitute({
			id: ormEntity.id,
			tenantId: ormEntity.schoolId,
			year: ormEntity.year,
			startDate: new Date(ormEntity.startDate),
			endDate: new Date(ormEntity.endDate),
			nonWorkingDays: (ormEntity.nonWorkingDays ?? []).map((d) => new Date(d)),
			absenceThresholdPercent: ormEntity.absenceThresholdPercent,
			lateCountAbscenseAfterMinutes: ormEntity.lateCountAbscenseAfterMinutes,
			isActive: ormEntity.isActive,
			createdAt: ormEntity.createdAt,
			updatedAt: ormEntity.updatedAt,
		});
	}
}
