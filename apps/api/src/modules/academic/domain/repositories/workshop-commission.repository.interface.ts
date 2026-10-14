import { WorkshopCommission } from '../entities/workshop-commission.entity';

export interface IWorkshopCommissionRepository {
	findByCourse(courseId: string): Promise<WorkshopCommission[]>;
	findById(id: string): Promise<WorkshopCommission | null>;
	findByPreceptor(preceptorId: string): Promise<WorkshopCommission[]>;
	findByTenant(tenantId: string): Promise<WorkshopCommission[]>;
	save(commission: WorkshopCommission): Promise<void>;
}
