import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsDateString,
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
} from 'class-validator';

// create-student.request.dto.ts
export class CreateStudentRequestDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		type: String,
		description: 'Nombre del estudiante.',
		example: 'Sofía',
	})
	firstName!: string;
	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		type: String,
		description: 'Apellido del estudiante.',
		example: 'González',
	})
	lastName!: string;
	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		type: String,
		description: 'Número de documento del estudiante.',
		example: '45233210',
	})
	documentNumber!: string;
	@IsDateString()
	@ApiProperty({
		type: String,
		description: 'Fecha de nacimiento del estudiante (formato YYYY-MM-DD).',
		example: '2014-03-15',
	})
	birthDate!: string;
	@IsUUID()
	@ApiProperty({
		type: String,
		description: 'ID del curso en el que se inscribe al estudiante.',
		example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
	})
	courseId!: string;
	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		type: String,
		description: 'Nombre y apellido del tutor.',
		example: 'María González',
	})
	tutorName!: string;
	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		type: String,
		description: 'Teléfono de contacto del tutor.',
		example: '+54 11 5555-1234',
	})
	tutorPhone!: string;
	@IsEmail()
	@IsOptional()
	@ApiPropertyOptional({
		type: String,
		description: 'Email del tutor (opcional).',
		example: 'maria.gonzalez@example.com',
	})
	tutorEmail?: string;
}
