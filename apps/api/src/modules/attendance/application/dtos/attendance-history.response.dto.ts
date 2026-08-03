import { ApiProperty } from '@nestjs/swagger';
import { AttendanceStatus } from '@repo/common';
// attendance-history.response.dto.ts

export class AttendanceHistoryResponseDto {
	@ApiProperty({
		description: 'Identificador del estudiante',
		example: '1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f',
	})
	readonly studentId!: string;

	@ApiProperty({
		description: 'Nombre completo del estudiante',
		example: 'Martina González',
	})
	readonly studentName!: string;

	@ApiProperty({
		description: 'Registros de asistencia del estudiante por fecha',
		type: 'array',
		example: [
			{ date: '2026-03-10T13:00:00.000Z', status: 'present' },
			{ date: '2026-03-11T13:00:00.000Z', status: 'absent' },
		],
	})
	readonly records!: { date: Date; status: AttendanceStatus }[];

	constructor(props: {
		studentId: string;
		studentName: string;
		records: { date: Date; status: AttendanceStatus }[];
	}) {
		Object.assign(this, props);
	}
}
