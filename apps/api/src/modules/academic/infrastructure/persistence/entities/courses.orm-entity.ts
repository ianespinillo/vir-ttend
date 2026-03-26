import {
	Collection,
	Entity,
	ManyToOne,
	OneToMany,
	Property,
} from '@mikro-orm/core';
import { LevelType, ShiftType } from '@repo/common';
import { BaseEntity } from '../../../../shared/database/entities/base.entity';
import { CourseRepository } from '../repositories/course.repository';
import { AcademicYearOrmEntity } from './academic-year.orm-entity';
import { SubjectOrmEntity } from './subject.orm-entity';

@Entity({ tableName: 'courses', repository: () => CourseRepository })
export class CourseOrmEntity extends BaseEntity {
	@Property({
		type: 'uuid',
	})
	schoolId!: string;

	@Property({
		type: 'uuid',
	})
	academicYearId!: string;

	@Property({
		type: 'uuid',
	})
	preceptorId!: string;

	@Property({
		type: 'string',
	})
	level!: LevelType;

	@Property()
	isActive!: boolean;

	@Property({
		type: 'number',
	})
	yearNumber!: number;

	@Property({
		type: 'number',
	})
	division!: string;

	@Property({
		type: 'string',
	})
	shift!: ShiftType;

	@ManyToOne(() => AcademicYearOrmEntity, { fieldName: 'academicYearId' })
	academicYear!: AcademicYearOrmEntity;

	@OneToMany(
		() => SubjectOrmEntity,
		(subject) => subject.course,
	)
	subjects = new Collection<SubjectOrmEntity>(this);
}
