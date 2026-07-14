import { PaginatedResponse } from '@repo/common';
import { AttendanceAlert } from '../entities/attendance-alert.entity';

export interface IAttendanceAlertRepository {
	findById(alertId: string): Promise<AttendanceAlert | null>;
	findByStudentId(studentId: string): Promise<AttendanceAlert[]>;
	findByStudentAndDateRange(
		studentId: string,
		from: Date,
		to: Date,
	): Promise<AttendanceAlert[]>;
	findUnSeen(coursesId: string[]): Promise<AttendanceAlert[]>;
	countUnSeen(coursesId: string[]): Promise<number>;
	findByPreceptor(
		courseId: string[],
		pageOptions: {
			page: number;
			perPage?: number;
		},
		type?: string,
	): Promise<PaginatedResponse<AttendanceAlert>>;

	save(alert: AttendanceAlert): Promise<void>;
}
