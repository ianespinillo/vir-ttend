import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { DAYOFWEEK } from '@repo/common';
import { BaseEntity } from '../../../../shared/database/entities/base.entity';
import { ScheduleSlotRepository } from '../repositories/schedule-slot.repository';
import { SubjectOrmEntity } from './subject.orm-entity';

// schedule-slot.orm-entity.ts
@Entity({
	tableName: 'schedule_slots',
	repository: () => ScheduleSlotRepository,
})
export class ScheduleSlotOrmEntity extends BaseEntity {
	@Property() subjectId!: string;
	@Property() courseId!: string;
	@Property() dayOfWeek!: DAYOFWEEK;
	@Property() startTime!: string;
	@Property() endTime!: string;

	@ManyToOne(() => SubjectOrmEntity, { fieldName: 'subjectId' })
	subject!: SubjectOrmEntity;
}
