import { ApiProperty } from '@nestjs/swagger';
import { ATTENDANCE_STATUS, AttendanceStatus } from '@repo/common';

export class WorkshopAttendanceRecordResponseDto {
	@ApiProperty({
		description: 'Identificador del registro, nulo si aún no se tomó asistencia',
		nullable: true,
		type: String,
	})
	readonly id!: string | null;

	@ApiProperty({ description: 'Identificador del estudiante' })
	readonly studentId!: string;

	@ApiProperty({
		description: 'Nombre completo del estudiante',
		example: 'González, Martina',
	})
	readonly studentName!: string;

	@ApiProperty({
		description: 'Estado de asistencia, nulo si aún no se tomó asistencia',
		enum: ATTENDANCE_STATUS,
		nullable: true,
	})
	readonly status!: AttendanceStatus | null;

	@ApiProperty({
		description: 'Usuario que editó el registro por última vez',
		nullable: true,
		type: String,
	})
	readonly editedBy!: string | null;

	@ApiProperty({
		description: 'Fecha y hora de la última edición',
		nullable: true,
		type: Date,
	})
	readonly editedAt!: Date | null;

	constructor(props: WorkshopAttendanceRecordResponseDto) {
		Object.assign(this, props);
	}
}

export class WorkshopAttendanceResponseDto {
	@ApiProperty({ description: 'Identificador de la comisión' })
	readonly commissionId!: string;

	@ApiProperty({ description: 'Código de la comisión', example: '141' })
	readonly commissionCode!: string;

	@ApiProperty({ description: 'Identificador del curso' })
	readonly courseId!: string;

	@ApiProperty({ description: 'Nombre del curso', example: '1° 4°' })
	readonly courseName!: string;

	@ApiProperty({ description: 'Fecha consultada', type: Date })
	readonly date!: Date;

	@ApiProperty({
		description:
			'Estudiantes activos de la comisión ordenados por apellido y nombre',
		type: [WorkshopAttendanceRecordResponseDto],
	})
	readonly records!: WorkshopAttendanceRecordResponseDto[];

	constructor(props: WorkshopAttendanceResponseDto) {
		Object.assign(this, props);
	}
}

export class MyWorkshopCommissionResponseDto {
	@ApiProperty({ description: 'Identificador de la comisión' })
	readonly commissionId!: string;

	@ApiProperty({ description: 'Código de la comisión', example: '141' })
	readonly code!: string;

	@ApiProperty({ description: 'Número de la comisión (1 o 2)', example: 1 })
	readonly number!: number;

	@ApiProperty({ description: 'Identificador del curso' })
	readonly courseId!: string;

	@ApiProperty({ description: 'Nombre del curso', example: '1° 4°' })
	readonly courseName!: string;

	@ApiProperty({
		description:
			'Indica si la comisión tiene taller en el día de la semana de la fecha consultada',
	})
	readonly hasWorkshopToday!: boolean;

	constructor(props: MyWorkshopCommissionResponseDto) {
		Object.assign(this, props);
	}
}
