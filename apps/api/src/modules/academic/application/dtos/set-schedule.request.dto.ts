import { DAYOFWEEK } from '@repo/common';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

interface Slot {
	dayOfWeek: DAYOFWEEK;
	startTime: string;
	endTime: string;
}
export class SetScheduleRequestDto {
	@IsNotEmpty()
	@IsString()
	subjectId!: string;

	@IsNotEmpty()
	@IsArray()
	slots!: Slot[];
}
