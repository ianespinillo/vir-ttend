import { ApiProperty } from '@nestjs/swagger';
import { ILoginResponse } from '@repo/common';
import { TenantOptionDto } from './tenant-option.dto';

// login.response.dto.ts
export class LoginResponseDto implements ILoginResponse {
	@ApiProperty({
		description: 'Identificador único del usuario (UUID v4).',
		example: '6f2a8c1e-4b7d-4f5a-9d3b-2c1e4f6a8b0d',
	})
	userId!: string;

	@ApiProperty({
		description:
			'Indica si el usuario es superadministrador del sistema (cuando no pertenece a ningún tenant).',
		example: false,
	})
	isSuperAdmin!: boolean;

	@ApiProperty({
		description:
			'Lista de tenants a los que pertenece el usuario, con el rol asignado en cada uno.',
		type: [TenantOptionDto],
		example: [
			{
				tenantId: '2d4e0f5a-8c1b-4d3e-9a2f-6b8c0d1e2f3a',
				tenantName: 'Escuela Técnica N°1',
				role: 'admin',
			},
		],
	})
	tenants!: TenantOptionDto[];
}
