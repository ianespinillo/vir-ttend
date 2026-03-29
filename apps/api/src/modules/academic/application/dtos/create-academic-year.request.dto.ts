import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateAcademicYearRequestDto {
	@IsNotEmpty()
	@IsString()
	schoolId!: string;

	@IsNotEmpty()
	@IsNumber()
	year!: number;

	@IsNotEmpty()
	@IsDate()
	startDate!: Date;

	@IsNotEmpty()
	@IsDate()
	endDate!: Date;

	@IsNotEmpty()
	@IsDate({
		each: true,
	})
	nonWorkingDays!: Date[];

	@IsNotEmpty()
	@IsNumber()
	absenceThresholdPercent!: number;

	@IsNotEmpty()
	@IsNumber()
	lateCountAbscenseAfterMinutes!: number;
}
