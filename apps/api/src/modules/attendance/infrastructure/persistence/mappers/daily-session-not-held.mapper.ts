import { DailySessionNotHeld } from '../../../domain/entities/daily-session-not-held.entity';
import { DailySessionNotHeldOrmEntity } from '../entities/daily-session-not-held.orm-entity';

export class DailySessionNotHeldMapper {
	static toOrm(domain: DailySessionNotHeld): DailySessionNotHeldOrmEntity {
		const entity = new DailySessionNotHeldOrmEntity();
		entity.id = domain.id;
		entity.tenantId = domain.tenantId;
		entity.courseId = domain.courseId;
		entity.date = domain.date;
		entity.reason = domain.reason ?? undefined;
		entity.createdBy = domain.createdBy;
		entity.createdAt = domain.createdAt;
		return entity;
	}

	static toDomain(orm: DailySessionNotHeldOrmEntity): DailySessionNotHeld {
		return DailySessionNotHeld.reconstitute({
			id: orm.id,
			tenantId: orm.tenantId,
			courseId: orm.courseId,
			date: orm.date,
			reason: orm.reason ?? undefined,
			createdBy: orm.createdBy,
			createdAt: orm.createdAt,
		});
	}
}
