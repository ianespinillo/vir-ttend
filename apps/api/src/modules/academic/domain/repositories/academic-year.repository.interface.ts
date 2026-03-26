import { AcademicYear } from '../entities/academic-year.entity';

export interface IAcademicYearRepository {
	findById(id: string): Promise<AcademicYear | null>;
	findBySchool(schoolId: string): Promise<AcademicYear[]>;
	findBySchoolAndYear(
		schoolId: string,
		year: number,
	): Promise<AcademicYear | null>;
	findActive(schoolId: string): Promise<AcademicYear | null>;
	save(entity: AcademicYear): Promise<void>;
}
