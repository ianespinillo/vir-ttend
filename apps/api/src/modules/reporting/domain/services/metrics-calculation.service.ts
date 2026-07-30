import { ATTENDANCE_STATUS } from '@repo/common';
import { AttendanceRecord } from '../entities/attendance-record.entity';
import { IStudentMetrics } from '../types/student-metrics.type';

export class MetricsCalculationService {
	calculateStudentMetrics(records: AttendanceRecord[]): IStudentMetrics {
		const total = records.length;
		const absent = records.filter(
			(r) => r.status === ATTENDANCE_STATUS.ABSENT,
		).length;
		const late = records.filter(
			(r) => r.status === ATTENDANCE_STATUS.LATE,
		).length;
		const justified = records.filter(
			(r) => r.status === ATTENDANCE_STATUS.JUSTIFIED,
		).length;
		const present = records.filter(
			(r) => r.status === ATTENDANCE_STATUS.PRESENT,
		).length;

		const absencePercent = total > 0 ? ((absent + late) / total) * 100 : 0;
		return {
			absencePercent,
			absent,
			late,
			justified,
			present,
			status: this.getStatus(absencePercent),
		};
	}
	private getStatus(absencePercent: number) {
		if (absencePercent >= 75) return 'exceeded';
		if (absencePercent >= 50) return 'at-risk';
		return 'ok';
	}
}
