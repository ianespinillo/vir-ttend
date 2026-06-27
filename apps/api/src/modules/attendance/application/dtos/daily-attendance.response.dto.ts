// daily-attendance.response.dto.ts
import { AttendanceMetricsResponseDto } from './attendance-metrics.response.dto';
import { AttendanceRecordResponseDto } from './attendance-record.response.dto';

export class DailyAttendanceResponseDto {
	readonly date!: Date;
	readonly courseId!: string;
	readonly records!: AttendanceRecordResponseDto[];
	readonly metrics!: AttendanceMetricsResponseDto;

	constructor(props: {
		date: Date;
		courseId: string;
		records: AttendanceRecordResponseDto[];
		metrics: AttendanceMetricsResponseDto;
	}) {
		Object.assign(this, props);
	}
}
