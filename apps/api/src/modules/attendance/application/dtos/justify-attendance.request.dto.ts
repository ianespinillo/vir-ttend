// justify-attendance.request.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class JustifyAttendanceRequestDto {
	@IsString() @IsNotEmpty() reason!: string;
	@IsString() @IsOptional() notes?: string;
}
