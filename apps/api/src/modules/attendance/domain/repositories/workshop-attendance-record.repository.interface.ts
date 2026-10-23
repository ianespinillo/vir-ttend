import { WorkshopAttendanceRecord } from '../entities/workshop-attendance-record.entity';

export interface IWorkshopAttendanceRecordRepository {
	findById(id: string): Promise<WorkshopAttendanceRecord | null>;
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
	/** Records of the course with a date between `from` and `to`, inclusive. */
	findByCourseAndDateRange(
		courseId: string,
		from: Date,
		to: Date,
	): Promise<WorkshopAttendanceRecord[]>;
	bulkSave(records: WorkshopAttendanceRecord[]): Promise<void>;
}
