import { EntityManager } from '@mikro-orm/core';
import { Subject } from '../../../domain/entities/subject.entity';
import { CourseOrmEntity } from '../entities/courses.orm-entity';
import { SubjectOrmEntity } from '../entities/subject.orm-entity';

export class SubjectMapper {
	static toOrm(entity: Subject, em: EntityManager): SubjectOrmEntity {
		const ormEntity = new SubjectOrmEntity();
		ormEntity.id = entity.id.getRaw();
		ormEntity.name = entity.name;
		ormEntity.area = entity.area;
		ormEntity.weeklyHours = entity.weeklyHours;
		ormEntity.courseId = entity.courseId;
		ormEntity.course = em.getReference(CourseOrmEntity, entity.courseId);
		ormEntity.teacherId = entity.teacherId;
		ormEntity.deletedAt = entity.deletedAt ?? null;
		return ormEntity;
	}
	static toDomain(ormEntity: SubjectOrmEntity): Subject {
		return Subject.reconstitute({
			id: ormEntity.id,
			courseId: ormEntity.courseId,
			teacherId: ormEntity.teacherId,
			name: ormEntity.name,
			area: ormEntity.area,
			weeklyHours: ormEntity.weeklyHours,
			createdAt: ormEntity.createdAt,
			updatedAt: ormEntity.updatedAt,
			deletedAt: ormEntity.deletedAt ?? undefined,
		});
	}
}
