import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { WorkshopJustificationRepository } from '../repository/workshop-justification.repository';

// FK workshop_attendance_record_id -> workshop_attendance_records
// (ON DELETE CASCADE) is declared in the migration.
@Entity({
	tableName: 'workshop_justification',
	repository: () => WorkshopJustificationRepository,
})
@Unique({
	name: 'workshop_justification_workshop_attendance_record_id_unique',
	properties: ['workshopAttendanceRecordId'],
})
export class WorkshopJustificationOrmEntity {
	@PrimaryKey({ type: 'uuid' })
	id!: string;

	@Property({ type: 'uuid' })
	workshopAttendanceRecordId!: string;

	@Property({ type: 'text' })
	reason!: string;

	@Property({ type: 'text', nullable: true })
	notes?: string;

	@Property({ type: 'uuid' })
	createdBy!: string;

	@Property({ type: 'timestamp' })
	createdAt!: Date;
}
