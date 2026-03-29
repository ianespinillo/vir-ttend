import { LevelType, ShiftType } from '@repo/common';

export class CreateCourseCommand {
	constructor(
		readonly academicYearId: string,
		readonly schoolId: string,
		readonly level: LevelType,
		readonly shift: ShiftType,
		readonly yearNumber: number,
		readonly division: string,
		readonly preceptorId: string,
	) {}
}
