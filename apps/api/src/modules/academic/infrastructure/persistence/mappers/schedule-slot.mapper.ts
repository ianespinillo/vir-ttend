import { EntityManager } from '@mikro-orm/core';
import { ScheduleSlot } from '../../../domain/entities/schedule-slot.entity';
import { ScheduleSlotOrmEntity } from '../entities/schedule-slot.orm-entity';
import { SubjectOrmEntity } from '../entities/subject.orm-entity';
export class ScheduleSlotMapper {
	static toOrm(entity: ScheduleSlot, em: EntityManager): ScheduleSlotOrmEntity {
		const ormEntity = new ScheduleSlotOrmEntity();
		ormEntity.id = entity.id;
		ormEntity.subjectId = entity.subjectId;
		ormEntity.courseId = entity.courseId;
		ormEntity.subject = em.getReference(SubjectOrmEntity, entity.subjectId);
		ormEntity.startTime = entity.startTime;
		ormEntity.endTime = entity.endTime;
		ormEntity.dayOfWeek = entity.dayOfWeek;
		return ormEntity;
	}

	static toDomain(entity: ScheduleSlotOrmEntity): ScheduleSlot {
		return ScheduleSlot.reconstitute(entity);
	}
}
