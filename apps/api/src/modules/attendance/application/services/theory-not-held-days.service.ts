import { Inject, Injectable } from '@nestjs/common';
import { SHIFT } from '@repo/common';
import { IAcademicYearPort } from '../../domain/ports/academic-year.port.interface';
import { IDailySessionNotHeldRepository } from '../../domain/repositories/daily-session-not-held.repository.interface';
import { toDateKey } from '../../domain/services/weighted-absence';

/** The course facts needed to know which days had no theory class. */
export interface TheoryNotHeldCourse {
	id: string;
	academicYearId: string;
	shift?: SHIFT;
	isWorkshopOnly: boolean;
}

/**
 * Days (`YYYY-MM-DD`) on which the theory shift of a course was not held: the
 * dates its preceptor marked as not held, plus the institutional suspensions
 * that cover its shift. On those days a workshop absence weighs 1.
 */
@Injectable()
export class TheoryNotHeldDaysService {
	constructor(
		@Inject('IDailySessionNotHeldRepository')
		private readonly notHeldRepo: IDailySessionNotHeldRepository,
		@Inject('IAcademicYearPort')
		private readonly academicYearPort: IAcademicYearPort,
	) {}

	/**
	 * Sorted, de-duplicated days of `from` to `to` (inclusive). A workshop-only
	 * course has no theory shift, so it never has any.
	 */
	async forCourse(
		course: TheoryNotHeldCourse,
		from: Date,
		to: Date,
	): Promise<string[]> {
		if (course.isWorkshopOnly) return [];
		const [markers, suspensions] = await Promise.all([
			this.notHeldRepo.findByCourseAndDateRange(course.id, from, to),
			this.academicYearPort.getNonWorkingDays(
				course.academicYearId,
				course.shift,
				from,
				to,
			),
		]);
		const days = new Set([
			...markers.map((marker) => toDateKey(marker.date)),
			...suspensions,
		]);
		return [...days].sort();
	}
}
