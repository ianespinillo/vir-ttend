import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { StudentStatus } from '@repo/common';
import { BaseEntity } from '../../../../shared/database/entities/base.entity';
import { StudentRepository } from '../repositories/student.repository';
import { CourseOrmEntity } from './courses.orm-entity';

// student.orm-entity.ts
@Entity({ tableName: 'students', repository: () => StudentRepository })
export class StudentOrmEntity extends BaseEntity {
	@Property() tenantId!: string;
	@Property() courseId!: string;
	@Property() firstName!: string;
	@Property() lastName!: string;
	@Property() documentNumber!: string;
	@Property() birthDate!: Date;
	@Property() tutorName!: string;
	@Property() tutorPhone!: string;
	@Property({ nullable: true }) tutorEmail?: string;
	@Property({ type: 'string' }) status!: StudentStatus;

	@ManyToOne(() => CourseOrmEntity, { fieldName: 'courseId' })
	course!: CourseOrmEntity;
}
