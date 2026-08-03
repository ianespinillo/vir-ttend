import { ApiProperty } from '@nestjs/swagger';
import { DAYOFWEEK } from '@repo/common';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

class ScheduleSlotRequestDto {
	@ApiProperty({
		enum: DAYOFWEEK,
		description: 'Día de la semana del bloque.',
		example: DAYOFWEEK.MONDAY,
	})
	dayOfWeek!: DAYOFWEEK;

	@ApiProperty({
		type: String,
		description: 'Hora de inicio (formato HH:mm).',
		example: '08:00',
	})
	startTime!: string;

	@ApiProperty({
		type: String,
		description: 'Hora de fin (formato HH:mm).',
		example: '09:00',
	})
	endTime!: string;
}

interface Slot {
	dayOfWeek: DAYOFWEEK;
	startTime: string;
	endTime: string;
}
export class SetScheduleRequestDto {
	@IsNotEmpty()
	@IsString()
	@ApiProperty({
		type: String,
		description: 'ID de la materia a la que se le asigna el horario.',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	subjectId!: string;

	@IsNotEmpty()
	@IsArray()
	@ApiProperty({
		type: [ScheduleSlotRequestDto],
		description:
			'Bloques horarios que reemplazan el horario actual de la materia.',
		example: [
			{ dayOfWeek: 'monday', startTime: '08:00', endTime: '09:00' },
			{ dayOfWeek: 'wednesday', startTime: '08:00', endTime: '09:00' },
		],
	})
	slots!: Slot[];
}
