import { Justification } from '../entities/justification.entity';

export interface IJustificationRepository {
	findByRecord(recordId: string): Promise<Justification | null>;
	save(record: Justification): Promise<void>;
}
