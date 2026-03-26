import { LevelType, ShiftType } from '@repo/common';
import { CourseId } from '../domain/value-objects/course-id.vo';

export class CourseCreatedEvent {
	readonly ocurredAt: Date;
	constructor(
		readonly courseId: CourseId,
		readonly tenantId: string,
		readonly academicYearId: string,
		readonly yearNumber: number,
		readonly division: string,
		readonly shift: ShiftType,
		readonly level: LevelType,
	) {
		this.ocurredAt = new Date();
	}
}
