import { Type } from 'class-transformer';
// get-alerts.request.dto.ts — como query params
import { IsEnum, IsInt, IsOptional, IsUUID } from 'class-validator';
import { AlertType } from '../../domain/value-objects/alert-type.vo';

export class GetAlertsRequestDto {
	@IsUUID() @IsOptional() courseId?: string;
	// Fix: This is not a Enum
	@IsEnum(AlertType) @IsOptional() alertType?: AlertType;
	@IsInt() @IsOptional() @Type(() => Number) page?: number = 1;
	@IsInt() @IsOptional() @Type(() => Number) limit?: number = 20;
}
