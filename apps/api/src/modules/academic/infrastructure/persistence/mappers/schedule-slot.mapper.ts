import { ScheduleSlot } from '../../../domain/entities/schedule-slot.entity';
import { ScheduleSlotOrmEntity } from '../entities/schedule-slot.orm-entity';
export class ScheduleSlotMapper {
	static toOrm(entity: ScheduleSlot): ScheduleSlotOrmEntity {
		const ormEntity = new ScheduleSlotOrmEntity();
		ormEntity.id = entity.id;
		ormEntity.startTime = entity.startTime;
		ormEntity.endTime = entity.endTime;
		ormEntity.dayOfWeek = entity.dayOfWeek;
		return ormEntity;
	}

	static toDomain(entity: ScheduleSlotOrmEntity): ScheduleSlot {
		return ScheduleSlot.reconstitute(entity);
	}
}
