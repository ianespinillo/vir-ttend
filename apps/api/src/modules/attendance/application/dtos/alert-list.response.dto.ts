import { AttendanceAlert } from '../../domain/entities/attendance-alert.entity';
// alerts-list.response.dto.ts
import { AlertResponseDto } from './alert.response.dto';

export class AlertsListResponseDto {
	readonly items!: AlertResponseDto[];
	readonly total!: number;
	readonly unseen!: number;

	constructor(alerts: AttendanceAlert[], total: number, unseen: number) {
		this.items = alerts.map((a) => new AlertResponseDto(a));
		this.total = total;
		this.unseen = unseen;
	}
}
