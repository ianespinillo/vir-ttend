import { ApiProperty } from '@nestjs/swagger';
import { AttendanceAlert } from '../../domain/entities/attendance-alert.entity';
// alerts-list.response.dto.ts
import { AlertResponseDto } from './alert.response.dto';

export class AlertsListResponseDto {
	@ApiProperty({
		description: 'Lista de alertas de asistencia del preceptor',
		type: [AlertResponseDto],
		example: [
			{
				id: '3f9a4b2c-8d1e-4f6a-9b3c-5d7e8f9a1b2c',
				studentId: '1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f',
				courseId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
				academicYearId: '7a1c2b3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
				alertType: 'warning',
				absencePercent: 62,
				seenAt: null,
				createdAt: '2026-03-10T13:00:00.000Z',
			},
		],
	})
	readonly items!: AlertResponseDto[];

	@ApiProperty({
		description: 'Cantidad total de alertas devueltas',
		example: 25,
		minimum: 0,
	})
	readonly total!: number;

	@ApiProperty({
		description: 'Cantidad de alertas sin marcar como vistas',
		example: 3,
		minimum: 0,
	})
	readonly unseen!: number;

	constructor(alerts: AttendanceAlert[], total: number, unseen: number) {
		this.items = alerts.map((a) => new AlertResponseDto(a));
		this.total = total;
		this.unseen = unseen;
	}
}
