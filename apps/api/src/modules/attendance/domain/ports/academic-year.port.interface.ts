import { IAcademicYearModel } from '../../application/models/academic-year.model';

export interface IAcademicYearPort {
	findActiveByTenant(tenantId: string): Promise<IAcademicYearModel | null>;
}
