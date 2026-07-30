import { AttendanceAlert } from '../entities/attendance-alert.entity';

export interface IAttendanceAlertPort {
	findByStudentId(id: string): Promise<AttendanceAlert[]>;
}
