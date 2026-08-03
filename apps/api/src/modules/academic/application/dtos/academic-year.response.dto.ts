import { ApiProperty } from '@nestjs/swagger';
import { IAcademicYearResponse } from '@repo/common';
import { AcademicYear } from '../../domain/entities/academic-year.entity';

export class AcademicYearResponseDto implements IAcademicYearResponse {
	@ApiProperty({
		type: String,
		description: 'Identificador único del año académico.',
		example: 'e6f5a4b3-2c1d-4e5f-8a9b-0c1d2e3f4a5b',
	})
	id: string;

	@ApiProperty({
		type: Number,
		description: 'Año calendario del ciclo lectivo.',
		example: 2026,
	})
	year: number;

	@ApiProperty({
		type: String,
		format: 'date-time',
		description: 'Fecha de inicio del ciclo lectivo.',
		example: '2026-03-02T00:00:00.000Z',
	})
	startDate: Date;

	@ApiProperty({
		type: String,
		format: 'date-time',
		description: 'Fecha de fin del ciclo lectivo.',
		example: '2026-12-18T00:00:00.000Z',
	})
	endDate: Date;

	@ApiProperty({
		type: Number,
		minimum: 0,
		maximum: 100,
		description: 'Porcentaje de ausencias permitido antes de generar una alerta.',
		example: 15,
	})
	absenceThresholdPercent: number;

	@ApiProperty({
		type: Number,
		minimum: 0,
		description:
			'Minutos de tolerancia para contar una llegada tarde como ausencia.',
		example: 10,
	})
	lateCountAbscenseAfterMinutes: number;

	@ApiProperty({
		type: Boolean,
		description: 'Indica si es el año académico activo.',
		example: true,
	})
	isActive: boolean;

	constructor(academicYear: AcademicYear) {
		this.id = academicYear.id.getRaw();
		this.year = academicYear.year;
		this.startDate = academicYear.startDate;
		this.endDate = academicYear.endDate;
		this.absenceThresholdPercent = academicYear.absenceThresholdPercent;
		this.lateCountAbscenseAfterMinutes =
			academicYear.lateCountAbscenseAfterMinutes;
		this.isActive = academicYear.isActive;
	}
}
