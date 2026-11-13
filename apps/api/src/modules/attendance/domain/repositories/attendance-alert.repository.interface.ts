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
	findUnSeen(
		coursesId?: string[],
		tenantId?: string,
	): Promise<AttendanceAlert[]>;
	countUnSeen(coursesId?: string[], tenantId?: string): Promise<number>;
	findByPreceptor(
		courseId: string[],
		pageOptions: {
			page: number;
			perPage?: number;
		},
		type?: string,
		tenantId?: string,
	): Promise<PaginatedResponse<AttendanceAlert>>;

	save(alert: AttendanceAlert): Promise<void>;

	/**
	 * Deletes the alerts of the student for the academic year whose threshold is
	 * above `total`, and returns how many were removed.
	 */
	deleteAboveThreshold(
		studentId: string,
		academicYearId: string,
		total: number,
	): Promise<number>;
}
