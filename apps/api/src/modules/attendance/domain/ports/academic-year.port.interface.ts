import { AcademicYear } from '../entities/academic-year.entity';

export interface IAcademicYearPort {
	findActiveByTenant(tenantId: string): Promise<AcademicYear | null>;
	findById(academicYearId: string): Promise<AcademicYear | null>;
}
