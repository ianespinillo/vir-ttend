import {
	Entity,
	Index,
	OneToOne,
	PrimaryKey,
	Property,
	Unique,
} from '@mikro-orm/core';
import { AttendanceStatus } from '@repo/common';
import { AttendanceRecordRepository } from '../repository/attendance-record.repository';
import { JustificationOrmEntity } from './justification.orm-entity';

@Entity({
	tableName: 'attendanceRecord',
	repository: () => AttendanceRecordRepository,
})
@Unique({ properties: ['courseId', 'studentId', 'subjectId', 'date'] })
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
