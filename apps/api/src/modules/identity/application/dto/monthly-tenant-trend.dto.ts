import { ApiProperty } from '@nestjs/swagger';

export class MonthlyTenantTrendDto {
	constructor(
		@(
			ApiProperty({
				description: 'Mes en formato YYYY-MM.',
				example: '2026-03',
			}) as ParameterDecorator
		)
		readonly month: string,
		@(
			ApiProperty({
				description: 'Cantidad de instituciones creadas en el mes.',
				example: 2,
			}) as ParameterDecorator
		)
		readonly count: number,
	) {}
}
