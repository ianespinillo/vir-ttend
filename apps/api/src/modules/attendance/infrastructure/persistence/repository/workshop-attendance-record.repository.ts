import { EntityRepository } from '@mikro-orm/postgresql';
import { WorkshopAttendanceRecord } from '../../../domain/entities/workshop-attendance-record.entity';
import { IWorkshopAttendanceRecordRepository } from '../../../domain/repositories/workshop-attendance-record.repository.interface';
import { WorkshopAttendanceRecordOrmEntity } from '../entities/workshop-attendance-record.orm-entity';
import { WorkshopAttendanceRecordMapper } from '../mappers/workshop-attendance-record.mapper';

export class WorkshopAttendanceRecordRepository
	extends EntityRepository<WorkshopAttendanceRecordOrmEntity>
	implements IWorkshopAttendanceRecordRepository
{
	async findByCommissionAndDate(
		commissionId: string,
		date: Date,
	): Promise<WorkshopAttendanceRecord[]> {
		const orms = await this.find({ workshopCommissionId: commissionId, date });
		return orms.map((orm) => WorkshopAttendanceRecordMapper.toDomain(orm));
	}

	async findByStudentAndDateRange(
		studentId: string,
		from: Date,
		to: Date,
	): Promise<WorkshopAttendanceRecord[]> {
		const orms = await this.find({
			studentId,
			date: { $gte: from, $lte: to },
		});
		return orms.map((orm) => WorkshopAttendanceRecordMapper.toDomain(orm));
	}

	async findByCourseAndDateRange(
		courseId: string,
		from: Date,
		to: Date,
	): Promise<WorkshopAttendanceRecord[]> {
		const orms = await this.find({
			courseId,
			date: { $gte: from, $lte: to },
		});
		return orms.map((orm) => WorkshopAttendanceRecordMapper.toDomain(orm));
	}

	async bulkSave(records: WorkshopAttendanceRecord[]): Promise<void> {
		for (const record of records) {
			const existing = await this.findOne({ id: record.id });
			if (existing) {
				existing.status = record.status;
				existing.editedBy = record.editedBy;
				existing.editedAt = record.editedAt;
			} else {
				this.em.persist(WorkshopAttendanceRecordMapper.toOrm(record));
			}
		}
		await this.em.flush();
	}
}
