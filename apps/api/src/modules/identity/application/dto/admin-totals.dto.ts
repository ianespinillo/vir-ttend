import { ApiProperty } from '@nestjs/swagger';

export class AdminTotalsDto {
	constructor(
		@(
			ApiProperty({
				description: 'Cantidad total de instituciones registradas.',
				example: 3,
			}) as ParameterDecorator
		)
		readonly totalTenants: number,
		@(
			ApiProperty({
				description: 'Cantidad de instituciones activas.',
				example: 2,
			}) as ParameterDecorator
		)
		readonly activeTenants: number,
		@(
			ApiProperty({
				description: 'Cantidad de instituciones inactivas.',
				example: 1,
			}) as ParameterDecorator
		)
		readonly inactiveTenants: number,
		@(
			ApiProperty({
				description: 'Cantidad total de usuarios con membresía activa.',
				example: 42,
			}) as ParameterDecorator
		)
		readonly totalUsers: number,
	) {}
}
