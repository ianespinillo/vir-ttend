import { AttendanceRecord } from '../entities/attendance-record.entity';

export interface IAttendanceRecordRepository {
	findById(id: string): Promise<AttendanceRecord | null>;

	findByCourseAndDate(courseId: string, date: Date): Promise<AttendanceRecord[]>;

	findByStudentAndCourseAndDate(
		courseId: string,
		studentId: string,
		date: Date,
	): Promise<AttendanceRecord | null>;

	findByDateRange(from: Date, to: Date): Promise<AttendanceRecord[]>;

	findByStudentAndDateRange(
		id: string,
		from: Date,
		to: Date,
	): Promise<AttendanceRecord[]>;

	findByCourseAndRange(
		courseId: string,
		from: Date,
		to: Date,
	): Promise<AttendanceRecord[]>;

	bulkSave(records: AttendanceRecord[]): Promise<void>;

	save(record: AttendanceRecord): Promise<void>;
}
