import { AttendanceRecord } from '../entities/attendance-record.entity';

/**
 * Attendance read side of the reports. Institutional absence totals come from
 * the daily records (no subject attendance) plus the workshop records, so the
 * two kinds are read apart. Workshop records are returned with the same shape.
 */
export interface IAttendanceRecordPort {
	/** Daily records of every student of the course in the range, one bulk read. */
	findDailyByCourseAndDateRange(
		courseId: string,
		from: Date,
		to: Date,
	): Promise<AttendanceRecord[]>;
	/** Workshop records of every student of the course in the range, one bulk read. */
	findWorkshopByCourseAndDateRange(
		courseId: string,
		from: Date,
		to: Date,
	): Promise<AttendanceRecord[]>;
	findDailyByStudentAndDateRange(
		studentId: string,
		from: Date,
		to: Date,
	): Promise<AttendanceRecord[]>;
	findWorkshopByStudentAndDateRange(
		studentId: string,
		from: Date,
		to: Date,
	): Promise<AttendanceRecord[]>;
}
