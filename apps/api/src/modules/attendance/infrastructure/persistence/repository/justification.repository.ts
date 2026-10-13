import { EntityRepository } from '@mikro-orm/postgresql';
import { Justification } from '../../../domain/entities/justification.entity';
import { IJustificationRepository } from '../../../domain/repositories/justification.repository.interface';
import { JustificationOrmEntity } from '../entities/justification.orm-entity';
import { JustificationMapper } from '../mappers/justification.mapper';

export class JustificationRepository
	extends EntityRepository<JustificationOrmEntity>
	implements IJustificationRepository
{
	async findByRecord(recordId: string): Promise<Justification | null> {
		const orm = await this.findOne({ attendanceRecordId: recordId });
		if (!orm) return null;
		return JustificationMapper.toDomain(orm);
	}

	async save(record: Justification): Promise<void> {
		const existing = await this.findOne({ id: record.id });
		if (existing) {
			existing.attendanceRecordId = record.attendanceRecordId.getRaw();
			existing.reason = record.reason.getRaw();
			existing.notes = record.notes ?? undefined;
			existing.createdBy = record.createdBy;
			existing.createdAt = record.createdAt;
		} else {
			const orm = JustificationMapper.toOrm(record);
			this.em.persist(orm);
		}
		await this.em.flush();
	}
}
