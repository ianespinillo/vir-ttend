import { ApiProperty } from '@nestjs/swagger';
import { AttendanceStatus } from '@repo/common';

export class ClassSessionDto {
	constructor(
		date: string,
		present: number,
		absent: number,
		late: number,
		justified: number,
		totalStudents: number,
	) {
		this.date = date;
		this.present = present;
		this.absent = absent;
		this.late = late;
		this.justified = justified;
		this.totalStudents = totalStudents;
	}

	@ApiProperty({
		description: 'Fecha de la clase',
		example: '2026-03-10',
	})
	date!: string;

	@ApiProperty({
		description: 'Cantidad de estudiantes presentes',
		example: 24,
		minimum: 0,
	})
	present!: number;

	@ApiProperty({
		description: 'Cantidad de estudiantes ausentes',
		example: 3,
		minimum: 0,
	})
	absent!: number;

	@ApiProperty({
		description: 'Cantidad de estudiantes que llegaron tarde',
		example: 2,
		minimum: 0,
	})
	late!: number;

	@ApiProperty({
		description: 'Cantidad de estudiantes justificados',
		example: 1,
		minimum: 0,
	})
	justified!: number;

	@ApiProperty({
		description: 'Cantidad total de estudiantes registrados en la clase',
		example: 30,
		minimum: 0,
	})
	totalStudents!: number;
}

export class StudentSubjectRecordDto {
	constructor(
		studentId: string,
		studentName: string,
		records: { date: string; status: AttendanceStatus }[],
		absencePercent: number,
	) {
		this.studentId = studentId;
		this.studentName = studentName;
		this.records = records;
		this.absencePercent = absencePercent;
	}

	@ApiProperty({
		description: 'Identificador del estudiante',
		example: '1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f',
	})
	studentId!: string;

	@ApiProperty({
		description: 'Nombre completo del estudiante',
		example: 'Martina González',
	})
	studentName!: string;

	@ApiProperty({
		description: 'Registros de asistencia del estudiante por fecha de clase',
		type: 'array',
		example: [
			{ date: '2026-03-10', status: 'present' },
			{ date: '2026-03-12', status: 'absent' },
		],
	})
	records!: { date: string; status: AttendanceStatus }[];

	@ApiProperty({
		description: 'Porcentaje de ausencias del estudiante en el período',
		example: 20,
		minimum: 0,
		maximum: 100,
	})
	absencePercent!: number;
}

export class SubjectHistoryResponseDto {
	@ApiProperty({
		description: 'Identificador de la materia',
		example: '7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
	})
	readonly subjectId!: string;

	@ApiProperty({
		description: 'Nombre de la materia',
		example: 'Matemática',
	})
	readonly subjectName!: string;

	@ApiProperty({
		description: 'Fecha inicial del período consultado',
		example: '2026-03-01T00:00:00.000Z',
		type: Date,
		format: 'date-time',
	})
	readonly from!: Date;

	@ApiProperty({
		description: 'Fecha final del período consultado',
		example: '2026-03-31T00:00:00.000Z',
		type: Date,
		format: 'date-time',
	})
	readonly to!: Date;

	@ApiProperty({
		description: 'Fechas de las clases registradas en el período',
		type: [Date],
		example: ['2026-03-10T13:00:00.000Z', '2026-03-12T13:00:00.000Z'],
	})
	readonly classDates!: Date[];

	@ApiProperty({
		description: 'Resumen por sesión de clase de la materia',
		type: [ClassSessionDto],
	})
	readonly sessions!: ClassSessionDto[];

	@ApiProperty({
		description: 'Registros de asistencia por estudiante',
		type: [StudentSubjectRecordDto],
	})
	readonly studentRecords!: StudentSubjectRecordDto[];

	constructor(data: {
		subjectId: string;
		subjectName: string;
		from: string;
		to: string;
		classDates: string[];
		sessions: ClassSessionDto[];
		studentRecords: StudentSubjectRecordDto[];
	}) {
		Object.assign(this, data);
	}
}
