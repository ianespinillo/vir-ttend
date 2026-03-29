import { EntityRepository } from '@mikro-orm/postgresql';
import { DAYOFWEEK } from '@repo/common';
import { ScheduleSlot } from '../../../domain/entities/schedule-slot.entity';
import { IScheduleRepository } from '../../../domain/repositories/schedule.repository.interface';
import { ScheduleSlotOrmEntity } from '../entities/schedule-slot.orm-entity';
import { ScheduleSlotMapper } from '../mappers/schedule-slot.mapper';

export class ScheduleSlotRepository
	extends EntityRepository<ScheduleSlotOrmEntity>
	implements IScheduleRepository
{
	async findBySubject(subjectId: string): Promise<ScheduleSlot[]> {
		const orms = await this.find({ subjectId });
		return orms.map((orm) => ScheduleSlotMapper.toDomain(orm));
	}
	async findByCourse(courseId: string): Promise<ScheduleSlot[]> {
		const orms = await this.find({ courseId });
		return orms.map((orm) => ScheduleSlotMapper.toDomain(orm));
	}
	async findByCourseAndDay(
		subjectId: string,
		day: DAYOFWEEK,
	): Promise<ScheduleSlot | null> {
		const orm = await this.findOne({ subjectId, dayOfWeek: day });
		if (!orm) {
			return null;
		}
		return ScheduleSlotMapper.toDomain(orm);
	}
	async deleteBySubject(subjectId: string): Promise<void> {
		await this.nativeDelete({ subjectId });
	}
	async save(scheduleSlot: ScheduleSlot): Promise<void> {
		const orm = ScheduleSlotMapper.toOrm(scheduleSlot);
		this.em.persist(orm);
		this.em.flush();
	}
	async saveMany(slots: ScheduleSlot[]): Promise<void> {
		const orms = slots.map((slot) => ScheduleSlotMapper.toOrm(slot));
		this.em.persist(orms);
		this.em.flush();
	}
}
