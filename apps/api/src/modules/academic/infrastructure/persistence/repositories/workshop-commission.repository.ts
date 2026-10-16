import { EntityRepository } from '@mikro-orm/postgresql';
import { WorkshopCommission } from '../../../domain/entities/workshop-commission.entity';
import { IWorkshopCommissionRepository } from '../../../domain/repositories/workshop-commission.repository.interface';
import { WorkshopCommissionOrmEntity } from '../entities/workshop-commission.orm-entity';
import { WorkshopCommissionMapper } from '../mappers/workshop-commission.mapper';

export class WorkshopCommissionRepository
	extends EntityRepository<WorkshopCommissionOrmEntity>
	implements IWorkshopCommissionRepository
{
	async findByCourse(courseId: string): Promise<WorkshopCommission[]> {
		const orms = await this.find({ courseId }, { orderBy: { number: 'asc' } });
		return orms.map((orm) => WorkshopCommissionMapper.toDomain(orm));
	}

	async findById(id: string): Promise<WorkshopCommission | null> {
		const orm = await this.findOne({ id });
		if (!orm) return null;
		return WorkshopCommissionMapper.toDomain(orm);
	}

	async findByPreceptor(preceptorId: string): Promise<WorkshopCommission[]> {
		const orms = await this.find(
			{ preceptorId },
			{ orderBy: { courseId: 'asc', number: 'asc' } },
		);
		return orms.map((orm) => WorkshopCommissionMapper.toDomain(orm));
	}

	async findByTenant(tenantId: string): Promise<WorkshopCommission[]> {
		const orms = await this.find(
			{ tenantId },
			{ orderBy: { courseId: 'asc', number: 'asc' } },
		);
		return orms.map((orm) => WorkshopCommissionMapper.toDomain(orm));
	}

	async save(commission: WorkshopCommission): Promise<void> {
		const existing = await this.findOne({ id: commission.id });
		if (existing) {
			existing.preceptorId = commission.preceptorId;
			existing.updatedAt = commission.updatedAt;
		} else {
			this.em.persist(WorkshopCommissionMapper.toOrm(commission));
		}
		await this.em.flush();
	}
}
