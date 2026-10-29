import { WORKSHOP_ONLY_DAILY_ATTENDANCE_MESSAGE } from '@repo/common';
import { DomainError } from '../../../../common/errors';
import { ICoursePort } from '../../domain/ports/courses.port.interface';
import { IDailySessionNotHeldRepository } from '../../domain/repositories/daily-session-not-held.repository.interface';

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

export const DAILY_SESSION_NOT_HELD_MESSAGE =
	'La clase de teoría de ese día está marcada como no dictada.';

/**
 * No attendance can be registered for a day whose theory shift was marked as
 * not held; the marker has to be removed first.
 */
export async function assertDailySessionHeld(
	notHeldRepo: IDailySessionNotHeldRepository,
	courseId: string,
	date: Date,
): Promise<void> {
	if (await notHeldRepo.findByCourseAndDate(courseId, date)) {
		throw new DomainError(DAILY_SESSION_NOT_HELD_MESSAGE);
	}
}
