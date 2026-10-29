import { EntityRepository } from '@mikro-orm/postgresql';
import { WorkshopSessionNotHeld } from '../../../domain/entities/workshop-session-not-held.entity';
import { IWorkshopSessionNotHeldRepository } from '../../../domain/repositories/workshop-session-not-held.repository.interface';
import { WorkshopSessionNotHeldOrmEntity } from '../entities/workshop-session-not-held.orm-entity';
import { WorkshopSessionNotHeldMapper } from '../mappers/workshop-session-not-held.mapper';

export class WorkshopSessionNotHeldRepository
	extends EntityRepository<WorkshopSessionNotHeldOrmEntity>
	implements IWorkshopSessionNotHeldRepository
{
	async findByCommissionAndDate(
		commissionId: string,
		date: Date,
	): Promise<WorkshopSessionNotHeld | null> {
		const orm = await this.findOne({
			workshopCommissionId: commissionId,
			date: date.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
		});
		return orm ? WorkshopSessionNotHeldMapper.toDomain(orm) : null;
	}

	async findByCommissionAndDateRange(
		commissionId: string,
		from: Date,
		to: Date,
	): Promise<WorkshopSessionNotHeld[]> {
		const orms = await this.find({
			workshopCommissionId: commissionId,
			date: { $gte: from, $lte: to },
		});
		return orms.map((orm) => WorkshopSessionNotHeldMapper.toDomain(orm));
	}

	async findByCommissionIdsAndDateRange(
		commissionIds: string[],
		from: Date,
		to: Date,
	): Promise<WorkshopSessionNotHeld[]> {
		if (commissionIds.length === 0) return [];
		const orms = await this.find({
			workshopCommissionId: { $in: commissionIds },
			date: { $gte: from, $lte: to },
		});
		return orms.map((orm) => WorkshopSessionNotHeldMapper.toDomain(orm));
	}

	async save(marker: WorkshopSessionNotHeld): Promise<void> {
		const existing = await this.findOne({ id: marker.id });
		if (existing) {
			// null (not undefined) so a cleared reason is written to the column.
			existing.reason = marker.reason ?? null;
		} else {
			this.em.persist(WorkshopSessionNotHeldMapper.toOrm(marker));
		}
		await this.em.flush();
	}

	async delete(commissionId: string, date: Date): Promise<void> {
		await this.nativeDelete({
			workshopCommissionId: commissionId,
			date: date.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
		});
	}
}
