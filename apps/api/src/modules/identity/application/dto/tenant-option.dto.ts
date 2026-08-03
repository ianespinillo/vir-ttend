import { ApiProperty } from '@nestjs/swagger';
import { ITenantOption, ROLES, Roles } from '@repo/common';

// tenant-option.dto.ts
export class TenantOptionDto implements ITenantOption {
	@ApiProperty({
		description: 'Identificador único del tenant (UUID v4).',
		example: '2d4e0f5a-8c1b-4d3e-9a2f-6b8c0d1e2f3a',
	})
	tenantId!: string;

	@ApiProperty({
		description: 'Nombre del tenant.',
		example: 'Escuela Técnica N°1',
	})
	tenantName!: string;

	@ApiProperty({
		description: 'Rol del usuario dentro de ese tenant.',
		enum: ROLES,
		example: ROLES.ADMIN,
	})
	role!: Roles;
}
