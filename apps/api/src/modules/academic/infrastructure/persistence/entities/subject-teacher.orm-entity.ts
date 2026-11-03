import { Entity, Index, ManyToOne, Property } from '@mikro-orm/core';
import { CommissionNumber } from '@repo/common';
import { BaseEntity } from '../../../../shared/database/entities/base.entity';
import { SubjectOrmEntity } from './subject.orm-entity';

/**
 * Teacher of a subject for one workshop commission (commission_number null =
 * the whole subject). Unique per (subject_id, coalesce(commission_number, 0)),
 * declared in the migration together with the FK (ON DELETE CASCADE).
 */
// subject-teacher.orm-entity.ts
@Entity({ tableName: 'subject_teachers' })
@Index({ properties: ['teacherId'] })
export class SubjectTeacherOrmEntity extends BaseEntity {
	@Property({ type: 'smallint', nullable: true })
	commissionNumber: CommissionNumber | null = null;
	@Property({ type: 'string', nullable: true }) teacherId: string | null = null;
	@Property({ type: 'string', length: 255, nullable: true })
	teacherName: string | null = null;

	@ManyToOne(() => SubjectOrmEntity, { fieldName: 'subject_id' })
	subject!: SubjectOrmEntity;
}
