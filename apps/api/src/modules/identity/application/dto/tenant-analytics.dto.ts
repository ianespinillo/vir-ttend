import { ApiProperty } from '@nestjs/swagger';

export class TenantAnalyticsDto {
	constructor(
		@(
			ApiProperty({
				description: 'Identificador único del tenant (UUID v4).',
				example: '2d4e0f5a-8c1b-4d3e-9a2f-6b8c0d1e2f3a',
			}) as ParameterDecorator
		)
		readonly id: string,
		@(
			ApiProperty({
				description: 'Nombre del tenant (escuela).',
				example: 'Escuela Técnica N°1',
			}) as ParameterDecorator
		)
		readonly name: string,
		@(
			ApiProperty({
				description: 'Subdominio único que identifica al tenant en la plataforma.',
				example: 'tec1',
			}) as ParameterDecorator
		)
		readonly subdomain: string,
		@(
			ApiProperty({
				description: 'Indica si el tenant está activo.',
				example: true,
			}) as ParameterDecorator
		)
		readonly isActive: boolean,
		@(
			ApiProperty({
				description: 'Cantidad de usuarios con membresía activa en el tenant.',
				example: 15,
			}) as ParameterDecorator
		)
		readonly userCount: number,
	) {}
}
