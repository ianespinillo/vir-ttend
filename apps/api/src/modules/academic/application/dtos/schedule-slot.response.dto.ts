import { ApiProperty } from '@nestjs/swagger';
import { DAYOFWEEK, IScheduleSlotResponse } from '@repo/common';
import { ScheduleSlot } from '../../domain/entities/schedule-slot.entity';

// schedule-slot.response.dto.ts
export class ScheduleSlotResponseDto implements IScheduleSlotResponse {
	@ApiProperty({
		type: String,
		description: 'Identificador único del bloque horario.',
		example: 'b2c3d4e5-6f7a-8b9c-0d1e-2f3a4b5c6d7e',
	})
	id: string;

	@ApiProperty({
		type: String,
		description: 'ID de la materia a la que pertenece el bloque.',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	subjectId: string;

	@ApiProperty({
		enum: DAYOFWEEK,
		description: 'Día de la semana del bloque.',
		example: DAYOFWEEK.MONDAY,
	})
	dayOfWeek: DAYOFWEEK;

	@ApiProperty({
		type: String,
		description: 'Hora de inicio (formato HH:mm).',
		example: '08:00',
	})
	startTime: string;

	@ApiProperty({
		type: String,
		description: 'Hora de fin (formato HH:mm).',
		example: '09:00',
	})
	endTime: string;

	constructor(slot: ScheduleSlot) {
		this.id = slot.id;
		this.subjectId = slot.subjectId;
		this.dayOfWeek = slot.dayOfWeek;
		this.startTime = slot.startTime;
		this.endTime = slot.endTime;
	}
}
