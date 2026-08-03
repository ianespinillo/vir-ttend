import { ApiProperty } from '@nestjs/swagger';
// attendance-metrics.response.dto.ts
export class AttendanceMetricsResponseDto {
	@ApiProperty({
		description: 'Cantidad total de estudiantes del curso',
		example: 30,
		minimum: 0,
	})
	readonly totalStudents!: number;

	@ApiProperty({
		description: 'Cantidad de estudiantes presentes',
		example: 22,
		minimum: 0,
	})
	readonly present!: number;

	@ApiProperty({
		description: 'Cantidad de estudiantes ausentes',
		example: 4,
		minimum: 0,
	})
	readonly absent!: number;

	@ApiProperty({
		description: 'Cantidad de estudiantes llegaron tarde',
		example: 2,
		minimum: 0,
	})
	readonly late!: number;

	@ApiProperty({
		description: 'Cantidad de estudiantes justificados',
		example: 1,
		minimum: 0,
	})
	readonly justified!: number;

	@ApiProperty({
		description: 'Cantidad de estudiantes sin registro de asistencia',
		example: 1,
		minimum: 0,
	})
	readonly notRecorded!: number;

	@ApiProperty({
		description: 'Porcentaje de ausencias sobre el total de estudiantes',
		example: 13,
		minimum: 0,
		maximum: 100,
	})
	readonly absencePercent!: number;

	constructor(props: {
		totalStudents: number;
		present: number;
		absent: number;
		late: number;
		justified: number;
		notRecorded: number;
		absencePercent: number;
	}) {
		Object.assign(this, props);
	}
}
