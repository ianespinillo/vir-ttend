import { AttendanceAlert } from '../../../domain/entities/attendance-alert.entity';
import { AlertType } from '../../../domain/value-objects/alert-type.vo';
import { AttendanceAlertOrmEntity } from '../entities/attendance-alert.orm-entity';

export class AttendanceAlertMapper {
	static toDomain(orm: AttendanceAlertOrmEntity): AttendanceAlert {
		const alertType = AlertType.fromPercent(orm.absencePercent);
		if (!alertType) throw new Error('Invalid absence percent for alert');
		return AttendanceAlert.reconstitute({
			...orm,
			alertType,
			seenAt: orm.seenAt ?? undefined,
			seenBy: orm.seenBy ?? undefined,
		});
	}
	static toOrm(domain: AttendanceAlert): AttendanceAlertOrmEntity {
		const orm = new AttendanceAlertOrmEntity();
		orm.id = domain.id;
		orm.absencePercent = domain.absencePercent;
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
