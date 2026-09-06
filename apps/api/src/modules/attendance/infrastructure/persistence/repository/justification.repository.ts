import { EntityRepository } from '@mikro-orm/postgresql';
import { Justification } from '../../../domain/entities/justification.entity';
import { IJustificationRepository } from '../../../domain/repositories/justification.repository.interface';
import { AttendanceRecordOrmEntity } from '../entities/attendance-record.orm-entity';
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
		const recordId = record.attendanceRecordId.getRaw();
		const existing = await this.findOne({
			$or: [{ id: record.id }, { attendanceRecordId: recordId }],
		});
		if (existing) {
			existing.reason = record.reason.getRaw();
			existing.notes = record.notes ?? undefined;
			await this.em.flush();
		} else {
			const orm = JustificationMapper.toOrm(record);
			orm.attendanceRecord = this.em.getReference(
				AttendanceRecordOrmEntity,
				recordId,
			);
			this.em.persist(orm);
			await this.em.flush();
		}
	}
}
