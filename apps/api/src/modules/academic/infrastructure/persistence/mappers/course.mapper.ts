import { Course } from '../../../domain/entities/course.entity';
import { CourseOrmEntity } from '../entities/courses.orm-entity';
export class CourseMapper {
	static toOrm(entity: Course): CourseOrmEntity {
		const ormEntity = new CourseOrmEntity();
		ormEntity.id = entity.id.getRaw();
		ormEntity.schoolId = entity.tenantId;
		ormEntity.preceptorId = entity.preceptorId;
		ormEntity.academicYearId = entity.academicYearId;
		ormEntity.level = entity.level;
		ormEntity.yearNumber = entity.yearNumber;
		ormEntity.division = entity.division;
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
