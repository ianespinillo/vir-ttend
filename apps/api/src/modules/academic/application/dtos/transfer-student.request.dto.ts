import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

// transfer-student.request.dto.ts
export class TransferStudentRequestDto {
	@IsUUID()
	@ApiProperty({
		type: String,
		description: 'ID del curso de destino del traslado.',
		example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
	})
	newCourseId!: string;
}
