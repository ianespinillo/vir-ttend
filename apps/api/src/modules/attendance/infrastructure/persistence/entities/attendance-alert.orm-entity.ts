import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';
import { AttendanceAlertRepository } from '../repository/attendance-alert.repository';

@Entity({
	tableName: 'attendance_alerts',
	repository: () => AttendanceAlertRepository,
})
@Index({ properties: ['studentId', 'academicYearId', 'alertType'] })
@Index({ properties: ['seenAt'] })
export class AttendanceAlertOrmEntity {
	@PrimaryKey({
		type: 'uuid',
	})
	id!: string;
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
	})
	academicYearId!: string;
	@Property({
		type: 'uuid',
	})
	tenantId!: string;
	@Property({
		type: 'string',
	})
	alertType!: string;
	@Property({
		type: 'float4',
	})
	absencePercent!: number;
	@Property({
		type: 'uuid',
		nullable: true,
	})
	seenBy: string | null = null;
	@Property({
		type: 'date',
		nullable: true,
	})
	seenAt: Date | null = null;
	@Property({
		type: 'datetime',
		default: Date.now(),
	})
	createdAt!: Date;
}
