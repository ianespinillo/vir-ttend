import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class GenerateReportRequestDto {
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
}
