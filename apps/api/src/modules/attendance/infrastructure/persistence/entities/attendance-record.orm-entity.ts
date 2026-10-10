import {
	Entity,
	Index,
	OneToOne,
	PrimaryKey,
	Property,
	Unique,
} from '@mikro-orm/core';
import { AttendanceStatus } from '@repo/common';
import { JustificationOrmEntity } from './justification.orm-entity';

@Entity({ tableName: 'attendanceRecord' })
@Unique({ properties: ['courseId', 'studentId', 'subjectId', 'date'] })
// Daily records have a NULL subjectId, which the unique above treats as distinct:
// this partial index enforces one daily record per student, course and date.
@Unique({
	name: 'attendanceRecord_daily_unique',
	expression:
		'create unique index "attendanceRecord_daily_unique" on "attendanceRecord" ("course_id", "student_id", "date") where "subject_id" is null',
})
@Index({ properties: ['courseId', 'date'] })
export class AttendanceRecordOrmEntity {
	@PrimaryKey({
		type: 'uuid',
	})
	id!: string;
	@Property({
		type: 'uuid',
	})
	tenantId!: string;
	@Property({
		type: 'uuid',
	})
	studentId!: string;
	@Property({
		type: 'uuid',
	})
	courseId!: string;
	@Property({
		type: 'uuid',
		nullable: true,
	})
	subjectId?: string;

	@Property({
		type: 'date',
	})
	date!: Date;
	@Property({
		type: 'string',
	})
	status!: AttendanceStatus;
	@Property({
		type: 'uuid',
	})
	editedBy!: string;
	@Property({
		type: 'timestamp',
	})
	editedAt!: Date;
	@Property({
		type: 'timestamp',
	})
	createdAt!: Date;

	@OneToOne(
		() => JustificationOrmEntity,
		(justification) => justification.attendanceRecord,
		{
			nullable: true,
		},
	)
	justification?: JustificationOrmEntity;
}
