import {
	IsIn,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	Min,
} from 'class-validator';

export class ExportPdfRequestDto {
	@IsNotEmpty()
	@IsString()
	courseId!: string;

	@IsNotEmpty()
	@IsNumber()
	@Min(1)
	@Max(12)
	month!: number;

	@IsNotEmpty()
	@IsNumber()
	@Min(2020)
	@Max(2100)
	year!: number;

	@IsOptional()
	@IsIn(['monthly', 'student'])
	type: 'monthly' | 'student' = 'monthly';

	@IsOptional()
	@IsString()
	studentId?: string;
}
