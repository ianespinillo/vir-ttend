import { CommissionNumber } from '@repo/common';
import { WorkshopCommission } from '../../../domain/entities/workshop-commission.entity';
import { WorkshopCommissionOrmEntity } from '../entities/workshop-commission.orm-entity';

export class WorkshopCommissionMapper {
	static toOrm(entity: WorkshopCommission): WorkshopCommissionOrmEntity {
		const orm = new WorkshopCommissionOrmEntity();
		orm.id = entity.id;
		orm.tenantId = entity.tenantId;
		orm.courseId = entity.courseId;
		orm.number = entity.number;
		orm.preceptorId = entity.preceptorId;
		orm.createdAt = entity.createdAt;
		orm.updatedAt = entity.updatedAt;
		return orm;
	}

	static toDomain(orm: WorkshopCommissionOrmEntity): WorkshopCommission {
		return WorkshopCommission.reconstitute({
			id: orm.id,
			tenantId: orm.tenantId,
			courseId: orm.courseId,
			number: orm.number as CommissionNumber,
			preceptorId: orm.preceptorId,
			createdAt: orm.createdAt,
			updatedAt: orm.updatedAt,
		});
	}
}
