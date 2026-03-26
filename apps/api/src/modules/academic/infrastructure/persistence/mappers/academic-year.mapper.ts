import { AcademicYear } from '../../../domain/entities/academic-year.entity';
import { AcademicYearOrmEntity } from '../entities/academic-year.orm-entity';

export class AcademicYearMapper {
	static toOrm(entity: AcademicYear): AcademicYearOrmEntity {
		const ormEntity = new AcademicYearOrmEntity();
		ormEntity.id = entity.id.getRaw();
		ormEntity.schoolId = entity.tenantId;
		ormEntity.year = entity.year;
		ormEntity.isActive = entity.isActive;
		return ormEntity;
	}
	static toDomain(ormEntity: AcademicYearOrmEntity): AcademicYear {
		return AcademicYear.reconstitute({
			...ormEntity,
			id: ormEntity.id,
			tenantId: ormEntity.schoolId,
		});
	}
}
