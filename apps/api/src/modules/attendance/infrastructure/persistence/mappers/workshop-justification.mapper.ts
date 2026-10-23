import { WorkshopJustification } from '../../../domain/entities/workshop-justification.entity';
import { WorkshopJustificationOrmEntity } from '../entities/workshop-justification.orm-entity';

export class WorkshopJustificationMapper {
	static toOrm(domain: WorkshopJustification): WorkshopJustificationOrmEntity {
		const entity = new WorkshopJustificationOrmEntity();
		entity.id = domain.id;
		entity.workshopAttendanceRecordId =
			domain.workshopAttendanceRecordId.getRaw();
		entity.reason = domain.reason.getRaw();
		entity.notes = domain.notes ?? undefined;
		entity.createdBy = domain.createdBy;
		entity.createdAt = domain.createdAt;
		return entity;
	}

	static toDomain(orm: WorkshopJustificationOrmEntity): WorkshopJustification {
		return WorkshopJustification.reconstitute({
			id: orm.id,
			workshopAttendanceRecordId: orm.workshopAttendanceRecordId,
			reason: orm.reason,
			notes: orm.notes ?? undefined,
			createdBy: orm.createdBy,
			createdAt: orm.createdAt,
		});
	}
}
