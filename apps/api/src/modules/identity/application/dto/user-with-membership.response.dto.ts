import { ApiProperty } from '@nestjs/swagger';
import { ROLES, Roles } from '@repo/common';

export class UserWithMembershipResponseDto {
	constructor(
		@(
			ApiProperty({
				description: 'Identificador único del usuario (UUID v4).',
				example: '6f2a8c1e-4b7d-4f5a-9d3b-2c1e4f6a8b0d',
			}) as ParameterDecorator
		)
		readonly id: string,
		@(
			ApiProperty({
				description: 'Email del usuario.',
				example: 'prof.jperez@escuela.edu.ar',
			}) as ParameterDecorator
		)
		readonly email: string,
		@(
			ApiProperty({
				description: 'Primer nombre del usuario.',
				example: 'Juan',
			}) as ParameterDecorator
		)
		readonly firstName: string,
		@(
			ApiProperty({
				description: 'Apellido del usuario.',
				example: 'Pérez',
			}) as ParameterDecorator
		)
		readonly lastName: string,
		@(
			ApiProperty({
				description: 'Rol del usuario dentro del tenant.',
				enum: ROLES,
				example: ROLES.TEACHER,
			}) as ParameterDecorator
		)
		readonly role: Roles,
		@(
			ApiProperty({
				description: 'Indica si la membresía del usuario está activa en el tenant.',
				example: true,
			}) as ParameterDecorator
		)
		readonly isActive: boolean,
		@(
			ApiProperty({
				description:
					'Indica si el usuario debe cambiar su contraseña en el próximo inicio de sesión.',
				example: true,
			}) as ParameterDecorator
		)
		readonly mustChangePassword: boolean,
		@(
			ApiProperty({
				description: 'ID del tenant al que pertenece la membresía.',
				required: false,
				example: '2d4e0f5a-8c1b-4d3e-9a2f-6b8c0d1e2f3a',
			}) as ParameterDecorator
		)
		readonly tenantId?: string,
		@(
			ApiProperty({
				description: 'Nombre del tenant.',
				required: false,
				example: 'Escuela Técnica N° 1',
			}) as ParameterDecorator
		)
		readonly tenantName?: string,
		@(
			ApiProperty({
				description: 'Fecha de creación del usuario.',
				required: false,
			}) as ParameterDecorator
		)
		readonly createdAt?: string,
	) {}
}
