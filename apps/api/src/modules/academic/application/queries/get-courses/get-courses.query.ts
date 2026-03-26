import { LevelType } from '@repo/common';

export class GetCoursesQuery {
	constructor(
		readonly academicYearId: string,
		readonly level?: LevelType,
		readonly preceptorId?: string,
	) {}
}
