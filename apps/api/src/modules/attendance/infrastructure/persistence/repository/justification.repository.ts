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
		const orm = await this.findOne({ id: recordId });
		if (!orm) return null;
		return JustificationMapper.toDomain(orm);
	}

	async save(record: Justification): Promise<void> {
		this.em.persist(JustificationMapper.toOrm(record));
		await this.em.flush();
	}
}
