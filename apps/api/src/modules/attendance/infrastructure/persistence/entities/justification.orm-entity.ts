import { Entity, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { AttendanceRecordOrmEntity } from './attendance-record.orm-entity';

@Entity({ tableName: 'justification' })
export class JustificationOrmEntity {
	@PrimaryKey({
		type: 'uuid',
	})
	id!: string;
	@Property({
		type: 'uuid',
	})
	attendanceRecordId!: string;

	@OneToOne(() => AttendanceRecordOrmEntity, {
		fieldName: 'attendanceRecordId',
	})
	attendanceRecord!: AttendanceRecordOrmEntity;
	@Property({
		type: 'text',
	})
	reason!: string;
	@Property({
		type: 'text',
		nullable: true,
	})
	notes?: string;
	@Property({
		type: 'uuid',
	})
	createdBy!: string;
	@Property({
		type: 'timestamp',
	})
	createdAt!: Date;
}
