import { AttendanceAlert } from '../../domain/entities/attendance-alert.entity';
// alert.response.dto.ts
import { AlertType } from '../../domain/value-objects/alert-type.vo';

export class AlertResponseDto {
	readonly id!: string;
	readonly studentId!: string;
	readonly courseId!: string;
	readonly academicYearId!: string;
	readonly alertType!: AlertType;
	readonly absencePercent!: number;
	readonly seenAt!: Date | null;
	readonly createdAt!: Date;

	constructor(alert: AttendanceAlert) {
		this.id = alert.id;
		this.studentId = alert.studentId;
		this.courseId = alert.courseId;
		this.academicYearId = alert.academicYearId;
		this.alertType = alert.alertType;
		this.absencePercent = alert.absencePercent;
		this.seenAt = alert.seenAt ?? null;
		this.createdAt = alert.createdAt;
	}
}
