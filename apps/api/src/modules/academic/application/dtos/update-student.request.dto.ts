import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsOptional, IsString } from 'class-validator';

// update-student.request.dto.ts
export class UpdateStudentRequestDto {
	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		type: String,
		description: 'Nombre del estudiante.',
		example: 'Sofía',
	})
	firstName?: string;
	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		type: String,
		description: 'Apellido del estudiante.',
		example: 'González',
	})
	lastName?: string;
	@IsDateString()
	@IsOptional()
	@ApiPropertyOptional({
		type: String,
		description: 'Fecha de nacimiento del estudiante (formato YYYY-MM-DD).',
		example: '2014-03-15',
	})
	birthDate?: string;
	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		type: String,
		description: 'Nombre y apellido del tutor.',
		example: 'María González',
	})
	tutorName?: string;
	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		type: String,
		description: 'Teléfono de contacto del tutor.',
		example: '+54 11 5555-1234',
	})
	tutorPhone?: string;
	@IsEmail()
	@IsOptional()
	@ApiPropertyOptional({
		type: String,
		description: 'Email del tutor.',
		example: 'maria.gonzalez@example.com',
	})
	tutorEmail?: string;
}
