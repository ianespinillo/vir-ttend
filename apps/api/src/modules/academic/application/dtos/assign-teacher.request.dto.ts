import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { COMMISSION_NUMBERS, CommissionNumber } from '@repo/common';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignTeacherRequestDto {
	@IsNotEmpty()
	@IsString()
	@ApiProperty({
		type: String,
		description: 'ID del docente (usuario con rol teacher).',
		example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
	})
	teacherId!: string;

	@IsOptional()
	@IsIn(COMMISSION_NUMBERS)
	@ApiPropertyOptional({
		type: Number,
		enum: COMMISSION_NUMBERS,
		description:
			'Comisión de taller que dicta el docente. Si se omite, el docente cubre toda la materia y reemplaza a los docentes por comisión.',
		example: 1,
	})
	commissionNumber?: CommissionNumber;
}
