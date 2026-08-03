import { ApiProperty } from '@nestjs/swagger';
// course-snapshot.dto.ts
import { COURSE_RISK_STATUS } from '@repo/common';

export class CourseSnapshotDto {
	@ApiProperty({
		description: 'Identificador del curso',
		example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
	})
	readonly courseId!: string;

	@ApiProperty({
		description: 'Nombre del curso',
		example: '3ro A - Matemática',
	})
	readonly courseName!: string;

	@ApiProperty({
		description: 'Nivel del curso',
		example: 'TERCERO',
	})
	readonly level!: string;

	@ApiProperty({
		description: 'Cantidad total de estudiantes del curso',
		example: 30,
		minimum: 0,
	})
	readonly totalStudents!: number;

	@ApiProperty({
		description: 'Cantidad de estudiantes presentes',
		example: 24,
		minimum: 0,
	})
	readonly present!: number;

	@ApiProperty({
		description: 'Cantidad de estudiantes ausentes',
		example: 3,
		minimum: 0,
	})
	readonly absent!: number;

	@ApiProperty({
		description: 'Cantidad de estudiantes que llegaron tarde',
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
		example: 0,
		minimum: 0,
	})
	readonly notRecorded!: number;

	@ApiProperty({
		description: 'Porcentaje de ausencias del curso',
		example: 10,
		minimum: 0,
		maximum: 100,
	})
	readonly absencePercent!: number;

	@ApiProperty({
		description: 'Estado de riesgo del curso según el porcentaje de ausencias',
		enum: COURSE_RISK_STATUS,
		example: COURSE_RISK_STATUS.WARNING,
	})
	readonly statusColor!: COURSE_RISK_STATUS;

	@ApiProperty({
		description: 'Fecha y hora de la última actualización del resumen',
		example: '2026-03-10T15:00:00.000Z',
		type: Date,
		format: 'date-time',
	})
	readonly lastUpdated!: Date;

	constructor(props: {
		courseId: string;
		courseName: string;
		level: string;
		totalStudents: number;
		present: number;
		absent: number;
		late: number;
		justified: number;
		notRecorded: number;
		absencePercent: number;
		statusColor: COURSE_RISK_STATUS;
		lastUpdated: Date;
	}) {
		Object.assign(this, props);
	}
}
