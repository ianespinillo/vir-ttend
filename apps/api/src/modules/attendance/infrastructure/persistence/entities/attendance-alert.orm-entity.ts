import { Entity, Index, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { AttendanceAlertRepository } from '../repository/attendance-alert.repository';

@Entity({
	tableName: 'attendance_alerts',
	repository: () => AttendanceAlertRepository,
})
@Unique({
	name: 'attendance_alerts_student_year_type_unique',
	properties: ['studentId', 'academicYearId', 'alertType'],
})
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
	/** Weighted absences when the alert was raised; fractional in 0.25 steps. */
	@Property({
		type: 'float4',
	})
	absenceCount!: number;
	@Property({
		type: 'integer',
	})
	threshold!: number;
	/** Legacy percent-based alerts only; new alerts store `absenceCount`. */
	@Property({
		type: 'float4',
		nullable: true,
	})
	absencePercent: number | null = null;
	@Property({
		type: 'uuid',
		nullable: true,
	})
	seenBy: string | null = null;
	@Property({
		type: 'datetime',
		nullable: true,
	})
	seenAt: Date | null = null;
	@Property({
		type: 'datetime',
		defaultRaw: 'now()',
	})
	createdAt!: Date;
}
