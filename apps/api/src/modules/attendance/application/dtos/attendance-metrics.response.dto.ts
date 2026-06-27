// attendance-metrics.response.dto.ts
export class AttendanceMetricsResponseDto {
	readonly totalStudents!: number;
	readonly present!: number;
	readonly absent!: number;
	readonly late!: number;
	readonly justified!: number;
	readonly notRecorded!: number;
	readonly absencePercent!: number;

	constructor(props: {
		totalStudents: number;
		present: number;
		absent: number;
		late: number;
		justified: number;
		notRecorded: number;
		absencePercent: number;
	}) {
		Object.assign(this, props);
	}
}
