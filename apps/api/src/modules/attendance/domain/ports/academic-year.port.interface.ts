import { SHIFT } from '@repo/common';
import { AcademicYear } from '../entities/academic-year.entity';

export interface IAcademicYearPort {
	findActiveByTenant(tenantId: string): Promise<AcademicYear | null>;
	findById(academicYearId: string): Promise<AcademicYear | null>;
	findByCourseId(courseId: string): Promise<AcademicYear | null>;
	/**
	 * Institutional non-working days (`YYYY-MM-DD`) that suspend a course of the
	 * given shift, from `from` to `to` inclusive. Without a shift any suspension
	 * of the day counts. None when the academic year does not exist.
	 */
	getNonWorkingDays(
		academicYearId: string,
		shift: SHIFT | undefined,
		from: Date,
		to: Date,
	): Promise<string[]>;
}
