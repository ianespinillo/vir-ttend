import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { AttendanceStatus } from '@repo/common';
import { BaseEntity } from '../../../../shared/database/entities/base.entity';
import { WorkshopAttendanceRecordRepository } from '../repository/workshop-attendance-record.repository';

// FK workshop_commission_id -> workshop_commissions (ON DELETE CASCADE) is
// declared in the migration.
@Entity({
	tableName: 'workshop_attendance_records',
	repository: () => WorkshopAttendanceRecordRepository,
})
@Unique({
	name: 'workshop_attendance_records_commission_student_date_unique',
	properties: ['workshopCommissionId', 'studentId', 'date'],
})
@Index({ properties: ['workshopCommissionId', 'date'] })
export class WorkshopAttendanceRecordOrmEntity extends BaseEntity {
	@Property({ type: 'uuid' })
	tenantId!: string;

	@Property({ type: 'uuid' })
	workshopCommissionId!: string;

	@Property({ type: 'uuid' })
	courseId!: string;

	@Property({ type: 'uuid' })
	studentId!: string;

	@Property({ type: 'date' })
	date!: Date;

	@Property({ type: 'string' })
	status!: AttendanceStatus;

	@Property({ type: 'uuid' })
	editedBy!: string;

	@Property({ type: 'timestamp' })
	editedAt!: Date;
}
