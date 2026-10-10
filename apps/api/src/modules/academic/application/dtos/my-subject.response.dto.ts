import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DAYOFWEEK } from '@repo/common';

export class MySubjectSlotResponseDto {
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

	constructor(slot: {
		dayOfWeek: DAYOFWEEK;
		startTime: string;
		endTime: string;
	}) {
		this.dayOfWeek = slot.dayOfWeek;
		this.startTime = slot.startTime;
		this.endTime = slot.endTime;
	}
}

export class MySubjectResponseDto {
	@ApiProperty({
		type: String,
		description: 'Identificador único de la materia.',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	subjectId: string;

	@ApiProperty({
		type: String,
		description: 'Nombre de la materia.',
		example: 'Matemática',
	})
	name: string;

	@ApiPropertyOptional({
		type: String,
		description: 'Área de la materia.',
		example: 'Ciencias Exactas',
	})
	area?: string;

	@ApiProperty({
		type: String,
		description: 'ID del curso al que pertenece la materia.',
		example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
	})
	courseId: string;

	@ApiProperty({
		type: String,
		description: 'Nombre descriptivo del curso.',
		example: '1° A - Mañana',
	})
	courseName: string;

	@ApiProperty({
		type: [MySubjectSlotResponseDto],
		description:
			'Bloques horarios de la materia durante toda la semana, ordenados por día y hora de inicio.',
	})
	slots: MySubjectSlotResponseDto[];

	constructor(props: {
		subjectId: string;
		name: string;
		area?: string;
		courseId: string;
		courseName: string;
		slots: MySubjectSlotResponseDto[];
	}) {
		this.subjectId = props.subjectId;
		this.name = props.name;
		this.area = props.area;
		this.courseId = props.courseId;
		this.courseName = props.courseName;
		this.slots = props.slots;
	}
}
