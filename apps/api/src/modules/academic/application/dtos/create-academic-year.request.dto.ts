import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateAcademicYearRequestDto {
	@IsNotEmpty()
	@IsString()
	@ApiProperty({
		type: String,
		description: 'ID del tenant (escuela) al que pertenece el año académico.',
		example: 'a1b2c3d4-5e6f-7890-abcd-ef1234567890',
	})
	schoolId!: string;

	@IsNotEmpty()
	@IsNumber()
	@ApiProperty({
		type: Number,
		description: 'Año calendario del ciclo lectivo.',
		example: 2026,
	})
	year!: number;

	@IsNotEmpty()
	@IsDate()
	@ApiProperty({
		type: String,
		format: 'date-time',
		description: 'Fecha de inicio del ciclo lectivo.',
		example: '2026-03-02T00:00:00.000Z',
	})
	startDate!: Date;

	@IsNotEmpty()
	@IsDate()
	@ApiProperty({
		type: String,
		format: 'date-time',
		description: 'Fecha de fin del ciclo lectivo.',
		example: '2026-12-18T00:00:00.000Z',
	})
	endDate!: Date;

	@IsNotEmpty()
	@IsDate({
		each: true,
	})
	@ApiProperty({
		type: 'array',
		items: { type: 'string', format: 'date-time' },
		description: 'Días no laborables del ciclo lectivo (feriados y recesos).',
		example: ['2026-07-09T00:00:00.000Z', '2026-12-25T00:00:00.000Z'],
	})
	nonWorkingDays!: Date[];

	@IsNotEmpty()
	@IsNumber()
	@ApiProperty({
		type: Number,
		minimum: 0,
		maximum: 100,
		description: 'Porcentaje de ausencias que dispara una alerta.',
		example: 15,
	})
	absenceThresholdPercent!: number;

	@IsNotEmpty()
	@IsNumber()
	@ApiProperty({
		type: Number,
		minimum: 0,
		description:
			'Minutos de tolerancia para contar una llegada tarde como ausencia.',
		example: 10,
	})
	lateCountAbscenseAfterMinutes!: number;
}
