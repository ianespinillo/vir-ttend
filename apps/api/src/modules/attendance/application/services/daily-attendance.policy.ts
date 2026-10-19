import { WORKSHOP_ONLY_DAILY_ATTENDANCE_MESSAGE } from '@repo/common';
import { DomainError } from '../../../../common/errors';
import { ICoursePort } from '../../domain/ports/courses.port.interface';

/**
 * Daily (theory) attendance does not exist in a workshop-only course (7th year
 * technical): its attendance is the workshop one, taken by the commission's
 * preceptor. An unknown course is left to the write itself, as before.
 */
export async function assertCourseHasDailyAttendance(
	coursePort: ICoursePort,
	courseId: string,
): Promise<void> {
	const course = await coursePort.findById(courseId);
	if (course?.isWorkshopOnly) {
		throw new DomainError(WORKSHOP_ONLY_DAILY_ATTENDANCE_MESSAGE);
	}
}
