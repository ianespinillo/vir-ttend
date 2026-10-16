import { WorkshopAttendanceRecord } from '../../../domain/entities/workshop-attendance-record.entity';
import { WorkshopAttendanceRecordOrmEntity } from '../entities/workshop-attendance-record.orm-entity';

export class WorkshopAttendanceRecordMapper {
	static toOrm(
		domain: WorkshopAttendanceRecord,
	): WorkshopAttendanceRecordOrmEntity {
		const entity = new WorkshopAttendanceRecordOrmEntity();
		entity.id = domain.id;
		entity.tenantId = domain.tenantId;
		entity.workshopCommissionId = domain.workshopCommissionId;
		entity.courseId = domain.courseId;
		entity.studentId = domain.studentId;
		entity.date = domain.date;
		entity.status = domain.status;
		entity.editedBy = domain.editedBy;
		entity.editedAt = domain.editedAt;
		entity.createdAt = domain.createdAt;
		return entity;
	}

	static toDomain(
		orm: WorkshopAttendanceRecordOrmEntity,
	): WorkshopAttendanceRecord {
		return WorkshopAttendanceRecord.reconstitute({
			id: orm.id,
			tenantId: orm.tenantId,
			workshopCommissionId: orm.workshopCommissionId,
			courseId: orm.courseId,
			studentId: orm.studentId,
			date: orm.date,
			status: orm.status,
			editedBy: orm.editedBy,
			editedAt: orm.editedAt,
			createdAt: orm.createdAt,
		});
	}
}
