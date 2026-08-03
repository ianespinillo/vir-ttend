import { ApiProperty } from '@nestjs/swagger';

export interface CourseSummaryEntry {
	month: number;
	year: number;
	averageAttendance: number;
}

export class CourseSummaryResponseDto {
	@ApiProperty({
		description: 'Identificador único del curso (UUID)',
		example: '6f9b5d2e-8c4a-4f1e-a3d7-0b2e1c9a7f44',
	})
	readonly courseId: string;

	@ApiProperty({
		description: 'Identificador del año académico (UUID)',
		example: 'a3c7e1f9-2b4d-4f5e-8a9c-1d0e2f3a4b5c',
	})
	readonly academicYearId: string;

	@ApiProperty({
		description: 'Promedio de asistencia mensual del curso por mes',
		type: 'array',
		items: {
			type: 'object',
			properties: {
				month: { type: 'number', example: 7 },
				year: { type: 'number', example: 2026 },
				averageAttendance: { type: 'number', example: 87.5 },
			},
		},
		example: [
			{ month: 7, year: 2026, averageAttendance: 87.5 },
			{ month: 6, year: 2026, averageAttendance: 82.1 },
			{ month: 5, year: 2026, averageAttendance: 90.4 },
		],
	})
	readonly months: CourseSummaryEntry[];

	constructor(props: {
		courseId: string;
		academicYearId: string;
		months: CourseSummaryEntry[];
	}) {
		this.courseId = props.courseId;
		this.academicYearId = props.academicYearId;
		this.months = props.months;
	}
}
