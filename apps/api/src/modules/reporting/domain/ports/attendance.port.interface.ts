import { AttendanceRecord } from '../entities/attendance-record.entity';

export interface IAttendanceRecordPort {
	findByCourseAndDateRange(
		courseId: string,
		from: Date,
		to: Date,
	): Promise<AttendanceRecord[]>;
	findByStudentAndDateRange(
		studentId: string,
		from: Date,
		to: Date,
	): Promise<AttendanceRecord[]>;
}
