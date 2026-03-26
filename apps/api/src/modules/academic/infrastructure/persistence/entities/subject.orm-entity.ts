import {
	Collection,
	Entity,
	ManyToOne,
	OneToMany,
	Property,
} from '@mikro-orm/core';
import { BaseEntity } from '../../../../shared/database/entities/base.entity';
import { SubjectRepository } from '../repositories/subject.repository';
import { CourseOrmEntity } from './courses.orm-entity';
import { ScheduleSlotOrmEntity } from './schedule-slot.orm-entity';

// subject.orm-entity.ts
@Entity({ tableName: 'subjects', repository: () => SubjectRepository })
export class SubjectOrmEntity extends BaseEntity {
	@Property() courseId!: string;
	@Property() teacherId!: string;
	@Property() name!: string;
	@Property() area!: string;
	@Property() weeklyHours!: number;

	@ManyToOne(() => CourseOrmEntity, { fieldName: 'courseId' })
	course!: CourseOrmEntity;

	@OneToMany(
		() => ScheduleSlotOrmEntity,
		(slot) => slot.subject,
		{
			fieldName: 'subjectId',
		},
	)
	slots = new Collection<ScheduleSlotOrmEntity>(this);
}
