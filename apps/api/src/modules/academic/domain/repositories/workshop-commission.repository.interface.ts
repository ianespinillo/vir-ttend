import { WorkshopCommission } from '../entities/workshop-commission.entity';

export interface IWorkshopCommissionRepository {
	findByCourse(courseId: string): Promise<WorkshopCommission[]>;
	findById(id: string): Promise<WorkshopCommission | null>;
	save(commission: WorkshopCommission): Promise<void>;
}
