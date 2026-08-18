import { EntityManager } from '@mikro-orm/core';
import { Course } from '../../../domain/entities/course.entity';
import { AcademicYearOrmEntity } from '../entities/academic-year.orm-entity';
import { CourseOrmEntity } from '../entities/courses.orm-entity';
export class CourseMapper {
	static toOrm(entity: Course, em: EntityManager): CourseOrmEntity {
		const ormEntity = new CourseOrmEntity();
		ormEntity.id = entity.id.getRaw();
		ormEntity.schoolId = entity.tenantId;
		ormEntity.preceptorId = entity.preceptorId;
		ormEntity.academicYearId = entity.academicYearId;
		ormEntity.level = entity.level;
		ormEntity.yearNumber = entity.yearNumber;
		ormEntity.isActive = entity.isActive;
		ormEntity.division = entity.division;
		ormEntity.shift = entity.shift;
		ormEntity.academicYear = em.getReference(
			AcademicYearOrmEntity,
			entity.academicYearId,
		);
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
