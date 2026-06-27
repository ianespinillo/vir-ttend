import { Injectable } from '@nestjs/common';
import { ISchedulePort } from '../../../attendance/domain/ports/schedule.port.interface';
import { ScheduleSlot } from '../../domain/entities/schedule-slot.entity';
import { IScheduleRepository } from '../../domain/repositories/schedule.repository.interface';

@Injectable()
export class ScheduleAdapter implements ISchedulePort {
	constructor(private readonly scheduleRepo: IScheduleRepository) {}
	async findByCourse(courseId: string): Promise<ScheduleSlot[]> {
		return await this.scheduleRepo.findByCourse(courseId);
	}
}
