import { WorkshopSessionNotHeld } from '../../../domain/entities/workshop-session-not-held.entity';
import { WorkshopSessionNotHeldOrmEntity } from '../entities/workshop-session-not-held.orm-entity';

export class WorkshopSessionNotHeldMapper {
	static toOrm(domain: WorkshopSessionNotHeld): WorkshopSessionNotHeldOrmEntity {
		const entity = new WorkshopSessionNotHeldOrmEntity();
		entity.id = domain.id;
		entity.tenantId = domain.tenantId;
		entity.workshopCommissionId = domain.workshopCommissionId;
		entity.date = domain.date;
		entity.reason = domain.reason ?? undefined;
		entity.createdBy = domain.createdBy;
		entity.createdAt = domain.createdAt;
		return entity;
	}

	static toDomain(orm: WorkshopSessionNotHeldOrmEntity): WorkshopSessionNotHeld {
		return WorkshopSessionNotHeld.reconstitute({
			id: orm.id,
			tenantId: orm.tenantId,
			workshopCommissionId: orm.workshopCommissionId,
			date: orm.date,
			reason: orm.reason ?? undefined,
			createdBy: orm.createdBy,
			createdAt: orm.createdAt,
		});
	}
}
