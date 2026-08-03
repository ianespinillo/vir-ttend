import { ApiProperty } from '@nestjs/swagger';
import { LEVEL, LevelType } from '@repo/common';
import { StudentMonthlyEntry } from '../../domain/types/detailed-student-report.type';
import { StudentReportEntry } from '../../domain/types/student-report-entry.type';

export class StudentReportResponseDto {
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
		description: 'Identificador único del curso (UUID)',
		example: '6f9b5d2e-8c4a-4f1e-a3d7-0b2e1c9a7f44',
	})
	readonly courseId: string;

	@ApiProperty({
		description: 'Nombre del curso',
		example: '3ro A',
	})
	readonly courseName: string;

	@ApiProperty({
		description: 'Nivel educativo del curso',
		enum: LEVEL,
		example: LEVEL.SECONDARY,
	})
	readonly level: LevelType;

	@ApiProperty({
		description: 'Identificador del año académico (UUID)',
		example: 'a3c7e1f9-2b4d-4f5e-8a9c-1d0e2f3a4b5c',
	})
	readonly academicYearId: string;

	@ApiProperty({
		description: 'Detalle de asistencia mensual del estudiante',
		type: 'array',
		items: {
			type: 'object',
			properties: {
				month: { type: 'number', example: 7 },
				year: { type: 'number', example: 2026 },
				present: { type: 'number', example: 19 },
				absent: { type: 'number', example: 1 },
				late: { type: 'number', example: 2 },
				justified: { type: 'number', example: 1 },
				absencePercent: { type: 'number', example: 4.5 },
				status: { type: 'string', enum: ['ok', 'at-risk', 'exceeded'] },
			},
		},
		example: [
			{
				month: 7,
				year: 2026,
				present: 19,
				absent: 1,
				late: 2,
				justified: 1,
				absencePercent: 4.5,
				status: 'ok',
			},
			{
				month: 6,
				year: 2026,
				present: 18,
				absent: 2,
				late: 1,
				justified: 1,
				absencePercent: 9.1,
				status: 'ok',
			},
		],
	})
	readonly months: StudentMonthlyEntry[];

	@ApiProperty({
		description: 'Totales del período del año académico',
		type: 'object',
		properties: {
			present: { type: 'number', example: 152 },
			absent: { type: 'number', example: 8 },
			late: { type: 'number', example: 12 },
			justified: { type: 'number', example: 5 },
			totalDays: { type: 'number', example: 177 },
			averageAbsencePercent: { type: 'number', example: 4.5 },
		},
		example: {
			present: 152,
			absent: 8,
			late: 12,
			justified: 5,
			totalDays: 177,
			averageAbsencePercent: 4.5,
		},
	})
	readonly totals: {
		present: number;
		absent: number;
		late: number;
		justified: number;
		totalDays: number;
		averageAbsencePercent: number;
	};

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

	constructor(props: {
		studentId: string;
		fullName: string;
		documentNumber: string;
		courseId: string;
		courseName: string;
		level: LevelType;
		academicYearId: string;
		months: StudentMonthlyEntry[];
		totals: {
			present: number;
			absent: number;
			late: number;
			justified: number;
			totalDays: number;
			averageAbsencePercent: number;
		};
		status: StudentReportEntry['status'];
		alerts: StudentReportEntry['alerts'];
	}) {
		this.studentId = props.studentId;
		this.fullName = props.fullName;
		this.documentNumber = props.documentNumber;
		this.courseId = props.courseId;
		this.courseName = props.courseName;
		this.level = props.level;
		this.academicYearId = props.academicYearId;
		this.months = props.months;
		this.totals = props.totals;
		this.status = props.status;
		this.alerts = props.alerts;
	}
}
