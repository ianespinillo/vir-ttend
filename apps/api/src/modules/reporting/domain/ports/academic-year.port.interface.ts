import { SHIFT } from '@repo/common';
import { AcademicYear } from '../entities/academic-year.entity';

export interface IAcademicYearPort {
	/**
	 * Working days of the academic year for a shift. With a `courseId`, the days
	 * its theory was marked as not held are subtracted too (once: a day that is
	 * already an institutional non-working day for the shift is not counted twice).
	 */
	getWorkingDaysBYAcademicYear(
		academicYear: string,
		shift?: SHIFT,
		courseId?: string,
	): Promise<number>;
	/**
	 * Institutional non-working days (`YYYY-MM-DD`) that suspend a course of the
	 * shift, from `from` to `to` inclusive.
	 */
	getNonWorkingDays(
		academicYearId: string,
		shift: SHIFT | undefined,
		from: Date,
		to: Date,
	): Promise<string[]>;
	findById(id: string): Promise<AcademicYear | null>;
}
