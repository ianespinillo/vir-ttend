import { ApiProperty } from '@nestjs/swagger';
// daily-attendance.response.dto.ts
import { AttendanceMetricsResponseDto } from './attendance-metrics.response.dto';
import { AttendanceRecordResponseDto } from './attendance-record.response.dto';

export class DailyAttendanceResponseDto {
	@ApiProperty({
		description: 'Fecha de la asistencia',
		example: '2026-03-10T13:00:00.000Z',
		type: Date,
		format: 'date-time',
	})
	readonly date!: Date;

	@ApiProperty({
		description: 'Identificador del curso',
		example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
	})
	readonly courseId!: string;

	@ApiProperty({
		description: 'Registros de asistencia de los estudiantes del curso',
		type: [AttendanceRecordResponseDto],
	})
	readonly records!: AttendanceRecordResponseDto[];

	@ApiProperty({
		description: 'Métricas de asistencia calculadas para el curso y la fecha',
		type: AttendanceMetricsResponseDto,
	})
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
