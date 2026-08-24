import {
	Cascade,
	Collection,
	Entity,
	ManyToOne,
	OneToMany,
	Property,
	Rel,
} from '@mikro-orm/core';

import { LevelType, ShiftType } from '@repo/common';
import { UserOrmEntity } from '../../../../identity/infrastructure/persistence/entities/user.orm-entity';
import { BaseEntity } from '../../../../shared/database/entities/base.entity';
import { CourseRepository } from '../repositories/course.repository';
import { AcademicYearOrmEntity } from './academic-year.orm-entity';
import { SubjectOrmEntity } from './subject.orm-entity';

@Entity({ tableName: 'courses', repository: () => CourseRepository })
export class CourseOrmEntity extends BaseEntity {
	@Property()
	schoolId!: string;

	@ManyToOne(() => AcademicYearOrmEntity, {
		fieldName: 'academicYearId',
	})
	academicYear!: Rel<AcademicYearOrmEntity>;

	@ManyToOne(() => UserOrmEntity, {
		fieldName: 'preceptor_id',
		nullable: true,
	})
	preceptor?: Rel<UserOrmEntity>;

	@Property()
	level!: LevelType;

	@Property()
	isActive!: boolean;

	@Property()
	yearNumber!: number;

	@Property()
	division!: string;

	@Property()
	shift!: ShiftType;

	@OneToMany(
		() => SubjectOrmEntity,
		(subject) => subject.course,
		{
			cascade: [Cascade.PERSIST],
		},
	)
	subjects = new Collection<SubjectOrmEntity>(this);

	// No son columnas. Son accesores derivados de las relaciones.

	get academicYearId(): string {
		return this.academicYear.id;
	}

	get preceptorId(): string | undefined {
		return this.preceptor?.id;
	}
}
