import { AcademicYear } from '../entities/academic-year.entity';

export interface IAcademicYearPort {
	getWorkingDaysBYAcademicYear(academicYear: string): Promise<number>;
	findById(id: string): Promise<AcademicYear | null>;
}
