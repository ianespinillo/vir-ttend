import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, ValidateIf } from 'class-validator';

export class AssignWorkshopPreceptorRequestDto {
	@ValidateIf((o: AssignWorkshopPreceptorRequestDto) => o.preceptorId !== null)
	@IsUUID()
	@ApiProperty({
		type: String,
		nullable: true,
		description: 'ID del preceptor de taller. null quita la asignación.',
		example: 'd7e8f9a0-1b2c-3d4e-5f6a-7b8c9d0e1f2a',
	})
	preceptorId!: string | null;
}
