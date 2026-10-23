import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetCourseStatusRequestDto {
	@IsBoolean()
	@ApiProperty({
		type: Boolean,
		description: 'Nuevo estado del curso: true lo activa, false lo desactiva.',
		example: false,
	})
	isActive: boolean;
}
