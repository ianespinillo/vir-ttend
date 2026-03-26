import { Subject } from '../../../domain/entities/subject.entity';
import { SubjectOrmEntity } from '../entities/subject.orm-entity';

export class SubjectMapper {
	static toOrm(entity: Subject): SubjectOrmEntity {
		const ormEntity = new SubjectOrmEntity();
		ormEntity.id = entity.id.getRaw();
		ormEntity.name = entity.name;
		ormEntity.area = entity.area;
		ormEntity.weeklyHours = entity.weeklyHours;
		ormEntity.courseId = entity.courseId;
		ormEntity.teacherId = entity.teacherId;
		return ormEntity;
	}
	static toDomain(ormEntity: SubjectOrmEntity): Subject {
		return Subject.reconstitute(ormEntity);
	}
}
