import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

// select-tenant.request.dto.ts
export class SelectTenantRequestDto {
	@IsUUID()
	@ApiProperty({
		description:
			'Identificador del usuario que selecciona el tenant. El backend toma el usuario real desde la cookie pending_user_id y no de este campo.',
		example: '6f2a8c1e-4b7d-4f5a-9d3b-2c1e4f6a8b0d',
	})
	userId!: string;

	@IsUUID()
	@ApiProperty({
		description: 'Identificador del tenant que el usuario quiere seleccionar.',
		example: '2d4e0f5a-8c1b-4d3e-9a2f-6b8c0d1e2f3a',
	})
	tenantId!: string;
}
