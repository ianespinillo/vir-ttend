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
		// The table maps the record FK twice (scalar + @OneToOne relation, same
		// column name). Both must be set or the INSERT omits the relation column.
		const recordRef = this.em.getReference(AttendanceRecordOrmEntity, recordId);

		// A record has at most one justification (unique FK). If the domain id is
		// unknown but the record already has one (justified, retaken as absent,
		// justified again), reuse that row and keep its primary key instead of
		// inserting a second one.
		const existing =
			(await this.findOne({ id: record.id })) ??
			(await this.findOne({ attendanceRecordId: recordId }));
		if (existing) {
			existing.attendanceRecordId = recordId;
			existing.attendanceRecord = recordRef;
			existing.reason = record.reason.getRaw();
			existing.notes = record.notes ?? undefined;
			existing.createdBy = record.createdBy;
			existing.createdAt = record.createdAt;
		} else {
			const orm = JustificationMapper.toOrm(record);
			orm.attendanceRecord = recordRef;
			this.em.persist(orm);
		}
		await this.em.flush();
	}
}
