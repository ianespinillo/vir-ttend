import { Injectable } from '@nestjs/common';
import { IScheduleRepository } from '../../../domain/repositories/schedule.repository.interface';
import { ScheduleSlotResponseDto } from '../../dtos/schedule-slot.response.dto';
import { GetScheduleQuery } from './get-schedule.query';

@Injectable()
export class GetScheduleHandler {
	constructor(private readonly scheduleRepository: IScheduleRepository) {}

	async execute(query: GetScheduleQuery): Promise<ScheduleSlotResponseDto[]> {
		const schedule = await this.scheduleRepository.findByCourse(query.courseId);
		if (schedule.length === 0) {
			// Si no hay horarios, devolver un arreglo vacío
			return [];
		}
		return schedule.map((slot) => new ScheduleSlotResponseDto(slot));
	}
}
