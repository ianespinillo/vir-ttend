import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AbsenceBreakdown } from '../../domain/types/absence-breakdown.type';
import { StudentReportEntry } from '../../domain/types/student-report-entry.type';

export class StudentReportEntryDto {
	@ApiProperty({
		description: 'Identificador único del estudiante (UUID)',
		example: 'b7d2e4f1-8a3c-4d5e-9f6a-2c1b0d3e5f7a',
	})
	readonly studentId: string;

	@ApiProperty({
		description: 'Nombre completo del estudiante',
		example: 'Juan Pérez',
	})
	readonly fullName: string;

	@ApiProperty({
		description: 'Número de documento del estudiante',
		example: '40123456',
	})
	readonly documentNumber: string;

	@ApiProperty({
		description: 'Cantidad de días presentes',
		example: 19,
	})
	readonly present: number;

	@ApiProperty({
		description:
			'Total de inasistencias ponderado por día (puede ser fraccionario): ausente 1, 0,5 en un día con taller; taller ausente 0,5; tarde 0,25; tarde fuera de tolerancia 0,5; tope de 1 por día. Las justificadas también cuentan.',
		example: 1.5,
	})
	readonly absent: number;

	@ApiPropertyOptional({
		description:
			'Origen del total de inasistencias: turno diario o taller. Ausente en reportes generados antes de la ponderación.',
		type: 'object',
		properties: {
			daily: { type: 'number', example: 1 },
			workshop: { type: 'number', example: 0.5 },
		},
	})
	readonly absenceBreakdown?: AbsenceBreakdown;

	@ApiPropertyOptional({
		description:
			'Días con clase efectivamente dada al estudiante (fechas distintas con asistencia diaria o de taller). Ausente en reportes anteriores.',
		example: 20,
	})
	readonly daysGiven?: number;

	@ApiProperty({
		description: 'Cantidad de llegadas tarde',
		example: 2,
	})
	readonly late: number;

	@ApiProperty({
		description: 'Cantidad de ausencias justificadas',
		example: 1,
	})
	readonly justified: number;

	@ApiProperty({
		description:
			'Porcentaje de inasistencias sobre los días con clase dada. Nulo si no se dio ninguna clase.',
		type: Number,
		nullable: true,
		example: 4.5,
	})
	readonly absencePercent: number | null;

	@ApiProperty({
		description: 'Estado de asistencia del estudiante',
		enum: ['ok', 'at-risk', 'exceeded'],
		example: 'ok',
	})
	readonly status: StudentReportEntry['status'];

	@ApiProperty({
		description: 'Alertas de inasistencia activas del estudiante',
		type: 'array',
		items: {
			type: 'object',
			properties: {
				status: {
					type: 'string',
					enum: ['warning', 'critical', 'exceeded'],
				},
			},
		},
		example: [{ status: 'warning' }],
	})
	readonly alerts: StudentReportEntry['alerts'];

	constructor(entry: StudentReportEntry) {
		this.studentId = entry.studentId;
		this.fullName = entry.fullName;
		this.documentNumber = entry.documentNumber;
		this.present = entry.present;
		this.absent = entry.absent;
		this.absenceBreakdown = entry.absenceBreakdown;
		this.daysGiven = entry.daysGiven;
		this.late = entry.late;
		this.justified = entry.justified;
		this.absencePercent = entry.absencePercent;
		this.status = entry.status;
		this.alerts = entry.alerts;
	}
}
