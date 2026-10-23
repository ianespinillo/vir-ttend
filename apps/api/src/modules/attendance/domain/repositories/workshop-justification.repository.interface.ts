import { WorkshopJustification } from '../entities/workshop-justification.entity';

export interface IWorkshopJustificationRepository {
	findByRecord(recordId: string): Promise<WorkshopJustification | null>;
	/** Justifications of the given workshop records, in a single query. */
	findByRecords(recordIds: string[]): Promise<WorkshopJustification[]>;
	save(justification: WorkshopJustification): Promise<void>;
}
