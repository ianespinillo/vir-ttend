import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IStudentDetailResponse } from '@repo/common';
import { Student } from '../../domain/entities/student.entity';
import { StudentResponseDto } from './student.response.dto';

// student-detail.response.dto.ts
export class StudentDetailResponseDto
	extends StudentResponseDto
	implements IStudentDetailResponse
{
	@ApiProperty({
		type: String,
		description: 'Nombre y apellido del tutor.',
		example: 'María González',
	})
	tutorName: string;

	@ApiProperty({
		type: String,
		description: 'Teléfono de contacto del tutor.',
		example: '+54 11 5555-1234',
	})
	tutorPhone: string;

	@ApiPropertyOptional({
		type: String,
		description: 'Email del tutor (opcional).',
		example: 'maria.gonzalez@example.com',
	})
	tutorEmail?: string;

	constructor(student: Student) {
		super(student);
		this.tutorName = student.tutorName;
		this.tutorPhone = student.tutorPhone;
		this.tutorEmail = student.tutorEmail;
	}
}
