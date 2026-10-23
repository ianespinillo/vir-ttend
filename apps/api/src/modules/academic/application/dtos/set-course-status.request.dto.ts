import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class SetCourseStatusRequestDto {
	// Validate the raw body value: the global pipe's implicit conversion would
	// turn the string "false" into true and let it pass @IsBoolean().
	@Transform(({ obj }: { obj: Record<string, unknown> }) => obj.isActive)
	@IsBoolean()
	@ApiProperty({
		type: Boolean,
		description: 'Nuevo estado del curso: true lo activa, false lo desactiva.',
		example: false,
	})
	isActive: boolean;
}
