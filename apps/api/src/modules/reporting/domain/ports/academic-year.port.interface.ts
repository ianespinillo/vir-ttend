import { SHIFT } from '@repo/common';
import { AcademicYear } from '../entities/academic-year.entity';

export interface IAcademicYearPort {
	getWorkingDaysBYAcademicYear(
		academicYear: string,
		shift?: SHIFT,
	): Promise<number>;
	findById(id: string): Promise<AcademicYear | null>;
}
