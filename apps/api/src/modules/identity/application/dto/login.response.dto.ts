import { ILoginResponse } from '@repo/common';
import { TenantOptionDto } from './tenant-option.dto';

// login.response.dto.ts
export class LoginResponseDto implements ILoginResponse {
	userId!: string;
	isSuperAdmin!: boolean;
	tenants!: TenantOptionDto[];
}
