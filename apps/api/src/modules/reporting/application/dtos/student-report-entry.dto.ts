import { ApiProperty } from '@nestjs/swagger';
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
		description: 'Cantidad de días ausentes',
		example: 1,
	})
	readonly absent: number;

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
		description: 'Porcentaje de ausencias del estudiante',
		example: 4.5,
	})
	readonly absencePercent: number;

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
		this.late = entry.late;
		this.justified = entry.justified;
		this.absencePercent = entry.absencePercent;
		this.status = entry.status;
		this.alerts = entry.alerts;
	}
}
