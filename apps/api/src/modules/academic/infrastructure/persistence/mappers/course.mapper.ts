import { EntityManager } from '@mikro-orm/core';
import { UserOrmEntity } from '../../../../identity/infrastructure/persistence/entities/user.orm-entity';
import { Course } from '../../../domain/entities/course.entity';
import { AcademicYearOrmEntity } from '../entities/academic-year.orm-entity';
import { CourseOrmEntity } from '../entities/courses.orm-entity';
export class CourseMapper {
	static toOrm(entity: Course, em: EntityManager): CourseOrmEntity {
		const ormEntity = new CourseOrmEntity();

		ormEntity.id = entity.id.getRaw();
		ormEntity.schoolId = entity.tenantId;

		ormEntity.preceptor = entity.preceptorId
			? em.getReference(UserOrmEntity, entity.preceptorId)
			: undefined;

		ormEntity.academicYear = em.getReference(
			AcademicYearOrmEntity,
			entity.academicYearId,
		);

		ormEntity.level = entity.level;
		ormEntity.yearNumber = entity.yearNumber;
		ormEntity.isActive = entity.isActive;
		ormEntity.division = entity.division.toString();
		ormEntity.shift = entity.shift;

		return ormEntity;
	}
	static toDomain(ormEntity: CourseOrmEntity): Course {
		return Course.reconstitute({
			...ormEntity,
			id: ormEntity.id,
			tenantId: ormEntity.schoolId,
			preceptorId: ormEntity.preceptorId,
			academicYearId: ormEntity.academicYearId,
			isActive: ormEntity.isActive,
		});
	}
}
