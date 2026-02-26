import { IsUUID } from 'class-validator';

// select-tenant.request.dto.ts
export class SelectTenantRequestDto {
	@IsUUID()
	userId!: string;

	@IsUUID()
	tenantId!: string;
}
