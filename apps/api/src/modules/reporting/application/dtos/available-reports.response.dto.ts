import { ApiProperty } from '@nestjs/swagger';
import { ReportPeriod } from '../../domain/value-objects/report-period.vo';

export class AvailableReportsResponseDto {
	@ApiProperty({
		description: 'Identificador único del curso (UUID)',
		example: '6f9b5d2e-8c4a-4f1e-a3d7-0b2e1c9a7f44',
	})
	readonly courseId: string;

	@ApiProperty({
		description:
			'Períodos (mes y año) que ya tienen reporte mensual generado para el curso',
		type: 'array',
		items: {
			type: 'object',
			properties: {
				month: { type: 'number', example: 7 },
				year: { type: 'number', example: 2026 },
			},
		},
		example: [
			{ month: 7, year: 2026 },
			{ month: 6, year: 2026 },
			{ month: 5, year: 2026 },
		],
	})
	readonly months: { month: number; year: number }[];
	constructor(courseId: string, months: ReportPeriod[]) {
		this.courseId = courseId;
		this.months = months.map((m) => ({ month: m.month, year: m.year }));
	}
}
