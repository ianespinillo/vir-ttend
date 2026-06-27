// attendance-history.response.dto.ts
import { AttendanceStatus } from '@repo/common';

export class AttendanceHistoryResponseDto {
	readonly studentId!: string;
	readonly studentName!: string;
	readonly records!: { date: Date; status: AttendanceStatus }[];

	constructor(props: {
		studentId: string;
		studentName: string;
		records: { date: Date; status: AttendanceStatus }[];
	}) {
		Object.assign(this, props);
	}
}
