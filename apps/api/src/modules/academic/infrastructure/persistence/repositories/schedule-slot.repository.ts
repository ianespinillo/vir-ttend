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
	async findByCourseAndSubject(
		courseId: string,
		subjectId: string,
	): Promise<ScheduleSlot[]> {
		const orms = await this.find({ courseId, subjectId });
		return orms.map((orm) => ScheduleSlotMapper.toDomain(orm));
	}
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
	async deleteByCourse(courseId: string): Promise<void> {
		await this.nativeDelete({ courseId });
	}
	async save(scheduleSlot: ScheduleSlot): Promise<void> {
		const existing = await this.findOne({ id: scheduleSlot.id });
		if (existing) {
			existing.startTime = scheduleSlot.startTime;
			existing.endTime = scheduleSlot.endTime;
			existing.dayOfWeek = scheduleSlot.dayOfWeek;
		} else {
			const orm = ScheduleSlotMapper.toOrm(scheduleSlot, this.em);
			this.em.persist(orm);
		}
		await this.em.flush();
	}
	async saveMany(slots: ScheduleSlot[]): Promise<void> {
		const existingOnes = await this.find({
			id: { $in: slots.map((slot) => slot.id) },
		});
		const existingById = new Map(existingOnes.map((orm) => [orm.id, orm]));
		for (const slot of slots) {
			const existing = existingById.get(slot.id);
			if (existing) {
				existing.startTime = slot.startTime;
				existing.endTime = slot.endTime;
				existing.dayOfWeek = slot.dayOfWeek;
			} else {
				this.em.persist(ScheduleSlotMapper.toOrm(slot, this.em));
			}
		}
		await this.em.flush();
	}
}
