import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceAlert } from '../../domain/entities/attendance-alert.entity';
// alert.response.dto.ts
import { AlertType } from '../../domain/value-objects/alert-type.vo';

export class AlertResponseDto {
	@ApiProperty({
		description: 'Identificador único de la alerta',
		example: '3f9a4b2c-8d1e-4f6a-9b3c-5d7e8f9a1b2c',
	})
	readonly id!: string;

	@ApiProperty({
		description: 'Identificador del estudiante asociado a la alerta',
		example: '1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f',
	})
	readonly studentId!: string;

	@ApiProperty({
		description: 'Identificador del curso asociado a la alerta',
		example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
	})
	readonly courseId!: string;

	@ApiProperty({
		description: 'Identificador del año académico en el que se generó la alerta',
		example: '7a1c2b3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
	})
	readonly academicYearId!: string;

	@ApiProperty({
		description: 'Nivel de la alerta: warning, critical o exceeded',
		example: 'warning',
	})
	readonly alertType!: AlertType;

	@ApiProperty({
		description: 'Porcentaje de inasistencias que disparó la alerta',
		example: 62,
		minimum: 0,
		maximum: 100,
	})
	readonly absencePercent!: number;

	@ApiPropertyOptional({
		description:
			'Fecha y hora en la que la alerta fue marcada como vista. Null si aún no se vio.',
		example: '2026-03-11T09:15:00.000Z',
		type: Date,
		format: 'date-time',
		nullable: true,
	})
	readonly seenAt!: Date | null;

	@ApiProperty({
		description: 'Fecha y hora de creación de la alerta',
		example: '2026-03-10T13:00:00.000Z',
		type: Date,
		format: 'date-time',
	})
	readonly createdAt!: Date;

	constructor(alert: AttendanceAlert) {
		this.id = alert.id;
		this.studentId = alert.studentId;
		this.courseId = alert.courseId;
		this.academicYearId = alert.academicYearId;
		this.alertType = alert.alertType;
		this.absencePercent = alert.absencePercent;
		this.seenAt = alert.seenAt ?? null;
		this.createdAt = alert.createdAt;
	}
}
