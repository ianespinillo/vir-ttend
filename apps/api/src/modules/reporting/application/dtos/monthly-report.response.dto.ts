import { ApiProperty } from '@nestjs/swagger';
import { LEVEL, LevelType } from '@repo/common';
import { MonthlyReport } from '../../domain/entities/monthly-report.entity';
import { StudentReportEntry } from '../../domain/types/student-report-entry.type';

export class MonthlyReportResponseDto {
	@ApiProperty({
		description: 'Identificador único del reporte (UUID)',
		example: 'd4f2b1a7-9c3e-4d5f-b6a8-0e1f2a3b4c5d',
	})
	readonly id: string;

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
		description: 'Período del reporte (mes y año)',
		type: 'object',
		properties: {
			month: { type: 'number', example: 7 },
			year: { type: 'number', example: 2026 },
		},
		example: { month: 7, year: 2026 },
	})
	readonly period: { month: number; year: number };

	@ApiProperty({
		description: 'Cantidad de días hábiles del período',
		example: 22,
	})
	readonly workingDays: number;

	@ApiProperty({
		description: 'Detalle de asistencia por estudiante',
		type: 'array',
		items: {
			type: 'object',
			properties: {
				studentId: {
					type: 'string',
					example: 'b7d2e4f1-8a3c-4d5e-9f6a-2c1b0d3e5f7a',
				},
				fullName: { type: 'string', example: 'Juan Pérez' },
				documentNumber: { type: 'string', example: '40123456' },
				present: { type: 'number', example: 19 },
				absent: { type: 'number', example: 1 },
				late: { type: 'number', example: 2 },
				justified: { type: 'number', example: 1 },
				absencePercent: { type: 'number', example: 4.5 },
				status: { type: 'string', enum: ['ok', 'at-risk', 'exceeded'] },
				alerts: {
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
				},
			},
		},
		example: [
			{
				studentId: 'b7d2e4f1-8a3c-4d5e-9f6a-2c1b0d3e5f7a',
				fullName: 'Juan Pérez',
				documentNumber: '40123456',
				present: 19,
				absent: 1,
				late: 2,
				justified: 1,
				absencePercent: 4.5,
				status: 'ok',
				alerts: [],
			},
			{
				studentId: 'c8e3f5a2-9b4d-4e6f-a7b0-3d2e4f5a6b7c',
				fullName: 'María González',
				documentNumber: '40345678',
				present: 15,
				absent: 4,
				late: 1,
				justified: 2,
				absencePercent: 18.2,
				status: 'at-risk',
				alerts: [{ status: 'warning' }],
			},
		],
	})
	readonly students: StudentReportEntry[];

	@ApiProperty({
		description: 'Resumen de métricas del reporte',
		type: 'object',
		properties: {
			averageAttendance: { type: 'number', example: 87.5 },
			studentsAtRisk: { type: 'number', example: 3 },
			studentsExceeded: { type: 'number', example: 1 },
		},
		example: { averageAttendance: 87.5, studentsAtRisk: 3, studentsExceeded: 1 },
	})
	readonly summary: {
		averageAttendance: number;
		studentsAtRisk: number;
		studentsExceeded: number;
	};

	@ApiProperty({
		description: 'Fecha y hora en que se generó el reporte',
		format: 'date-time',
		example: '2026-08-02T12:30:00.000Z',
	})
	readonly generatedAt: Date;

	constructor(report: MonthlyReport) {
		const data = report.data.toJSON;
		this.id = report.id;
		this.courseId = report.courseId;
		this.courseName = data.courseName;
		this.level = data.level;
		this.period = data.period;
		this.workingDays = data.workingDays;
		this.students = data.students;
		this.summary = data.summary;
		this.generatedAt = report.generatedAt;
	}
}
