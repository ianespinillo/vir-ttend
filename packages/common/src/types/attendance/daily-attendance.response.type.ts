import type { AttendanceMetrics } from './attendance-metrics.response.type.js';
import type { AttendanceRecord } from './attendance-record.response.type.js';

export interface DailyAttendance {
	date: Date;
	courseId: string;
	records: AttendanceRecord[];
	metrics: AttendanceMetrics;
}
