import { AttendanceAlert } from '../../../domain/entities/attendance-alert.entity';
import { AlertType } from '../../../domain/value-objects/alert-type.vo';
import { AttendanceAlertOrmEntity } from '../entities/attendance-alert.orm-entity';

export class AttendanceAlertMapper {
	static toDomain(orm: AttendanceAlertOrmEntity): AttendanceAlert {
		return AttendanceAlert.reconstitute({
			...orm,
			alertType: AlertType.fromStatus(orm.alertType),
			seenAt: orm.seenAt ?? undefined,
			seenBy: orm.seenBy ?? undefined,
		});
	}
	static toOrm(domain: AttendanceAlert): AttendanceAlertOrmEntity {
		const orm = new AttendanceAlertOrmEntity();
		orm.id = domain.id;
		orm.absenceCount = domain.absenceCount;
		orm.threshold = domain.threshold;
		orm.alertType = domain.alertType.status;
		orm.academicYearId = domain.academicYearId;
		orm.courseId = domain.courseId;
		orm.createdAt = domain.createdAt;
		orm.seenAt = domain.seenAt ?? null;
		orm.seenBy = domain.seenBy ?? null;
		orm.studentId = domain.studentId;
		orm.tenantId = domain.tenantId;
		return orm;
	}
}
