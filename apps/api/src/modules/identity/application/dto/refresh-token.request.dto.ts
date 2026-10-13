import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// refresh-token.request.dto.ts
export class RefreshTokenRequestDto {
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	@ApiPropertyOptional({
		description:
			'Refresh token para clientes móviles/nativos que no usan cookies. Se ignora si la cookie httpOnly refresh_token está presente.',
		example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
	})
	refreshToken?: string;
}
