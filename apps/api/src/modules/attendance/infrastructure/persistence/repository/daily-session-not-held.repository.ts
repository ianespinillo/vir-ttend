import { EntityRepository } from '@mikro-orm/postgresql';
import { DailySessionNotHeld } from '../../../domain/entities/daily-session-not-held.entity';
import { IDailySessionNotHeldRepository } from '../../../domain/repositories/daily-session-not-held.repository.interface';
import { DailySessionNotHeldOrmEntity } from '../entities/daily-session-not-held.orm-entity';
import { DailySessionNotHeldMapper } from '../mappers/daily-session-not-held.mapper';

export class DailySessionNotHeldRepository
	extends EntityRepository<DailySessionNotHeldOrmEntity>
	implements IDailySessionNotHeldRepository
{
	async findByCourseAndDate(
		courseId: string,
		date: Date,
	): Promise<DailySessionNotHeld | null> {
		const orm = await this.findOne({
			courseId,
			date: date.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
		});
		return orm ? DailySessionNotHeldMapper.toDomain(orm) : null;
	}

	async findByCourseAndDateRange(
		courseId: string,
		from: Date,
		to: Date,
	): Promise<DailySessionNotHeld[]> {
		const orms = await this.find({ courseId, date: { $gte: from, $lte: to } });
		return orms.map((orm) => DailySessionNotHeldMapper.toDomain(orm));
	}

	async save(marker: DailySessionNotHeld): Promise<void> {
		const existing = await this.findOne({ id: marker.id });
		if (existing) {
			existing.reason = marker.reason ?? undefined;
		} else {
			this.em.persist(DailySessionNotHeldMapper.toOrm(marker));
		}
		await this.em.flush();
	}

	async delete(courseId: string, date: Date): Promise<void> {
		await this.nativeDelete({
			courseId,
			date: date.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
		});
	}
}
