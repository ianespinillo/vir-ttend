import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

// enroll-student.request.dto.ts
export class EnrollStudentRequestDto {
	@IsUUID()
	@ApiProperty({
		type: String,
		description: 'ID del curso al que se inscribe el estudiante.',
		example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
	})
	courseId!: string;
}
