import { WorkshopAttendanceRecord } from '../entities/workshop-attendance-record.entity';

export interface IWorkshopAttendanceRecordRepository {
	findByCommissionAndDate(
		commissionId: string,
		date: Date,
	): Promise<WorkshopAttendanceRecord[]>;
	bulkSave(records: WorkshopAttendanceRecord[]): Promise<void>;
}
