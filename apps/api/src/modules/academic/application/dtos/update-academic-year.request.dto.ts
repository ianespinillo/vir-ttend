import { IsDate, IsNumber, IsOptional } from 'class-validator';

export class UpdateAcademicYearRequestDto {
	@IsDate({
		each: true,
	})
	@IsOptional()
	nonWorkingDays?: Date[];

	@IsOptional()
	@IsNumber()
	absenceThresholdPercent?: number;

	@IsOptional()
	@IsNumber()
	lateCountAbscenseAfterMinutes?: number;
}
