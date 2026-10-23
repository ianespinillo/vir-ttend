import { EntityRepository } from '@mikro-orm/postgresql';
import { WorkshopJustification } from '../../../domain/entities/workshop-justification.entity';
import { IWorkshopJustificationRepository } from '../../../domain/repositories/workshop-justification.repository.interface';
import { WorkshopJustificationOrmEntity } from '../entities/workshop-justification.orm-entity';
import { WorkshopJustificationMapper } from '../mappers/workshop-justification.mapper';

export class WorkshopJustificationRepository
	extends EntityRepository<WorkshopJustificationOrmEntity>
	implements IWorkshopJustificationRepository
{
	async findByRecord(recordId: string): Promise<WorkshopJustification | null> {
		const orm = await this.findOne({ workshopAttendanceRecordId: recordId });
		return orm ? WorkshopJustificationMapper.toDomain(orm) : null;
	}

	async findByRecords(recordIds: string[]): Promise<WorkshopJustification[]> {
		if (recordIds.length === 0) return [];
		const orms = await this.find({
			workshopAttendanceRecordId: { $in: recordIds },
		});
		return orms.map((orm) => WorkshopJustificationMapper.toDomain(orm));
	}

	async save(justification: WorkshopJustification): Promise<void> {
		const recordId = justification.workshopAttendanceRecordId.getRaw();
		// A record has at most one justification (unique FK): when it already has
		// one (justified, retaken as absent, justified again) reuse that row.
		const existing =
			(await this.findOne({ id: justification.id })) ??
			(await this.findOne({ workshopAttendanceRecordId: recordId }));
		if (existing) {
			existing.reason = justification.reason.getRaw();
			existing.notes = justification.notes ?? undefined;
			existing.createdBy = justification.createdBy;
			existing.createdAt = justification.createdAt;
		} else {
			this.em.persist(WorkshopJustificationMapper.toOrm(justification));
		}
		await this.em.flush();
	}
}
