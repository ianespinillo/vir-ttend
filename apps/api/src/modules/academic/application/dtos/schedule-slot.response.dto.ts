import { DAYOFWEEK, IScheduleSlotResponse } from '@repo/common';
import { ScheduleSlot } from '../../domain/entities/schedule-slot.entity';

// schedule-slot.response.dto.ts
export class ScheduleSlotResponseDto implements IScheduleSlotResponse {
	id: string;
	subjectId: string;
	dayOfWeek: DAYOFWEEK;
	startTime: string;
	endTime: string;

	constructor(slot: ScheduleSlot) {
		this.id = slot.id;
		this.subjectId = slot.subjectId;
		this.dayOfWeek = slot.dayOfWeek;
		this.startTime = slot.startTime;
		this.endTime = slot.endTime;
	}
}
