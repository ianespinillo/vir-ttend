import { ShiftType } from '@repo/common';

export class UpdateCourseCommand {
	constructor(
		readonly courseId: string,
		readonly preceptorId?: string,
		readonly shift?: ShiftType,
	) {}
}
