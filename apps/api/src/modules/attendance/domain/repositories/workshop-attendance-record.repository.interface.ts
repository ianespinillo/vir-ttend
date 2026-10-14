import { WorkshopAttendanceRecord } from '../entities/workshop-attendance-record.entity';

export interface IWorkshopAttendanceRecordRepository {
	findByCommissionAndDate(
		commissionId: string,
		date: Date,
	): Promise<WorkshopAttendanceRecord[]>;
	/** Records of the student with a date between `from` and `to`, inclusive. */
	findByStudentAndDateRange(
		studentId: string,
		from: Date,
		to: Date,
	): Promise<WorkshopAttendanceRecord[]>;
	bulkSave(records: WorkshopAttendanceRecord[]): Promise<void>;
}
