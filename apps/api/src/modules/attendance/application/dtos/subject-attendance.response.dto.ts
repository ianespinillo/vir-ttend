import { ApiProperty } from '@nestjs/swagger';
import { AttendanceRecordResponseDto } from './attendance-record.response.dto';

export class SubjectAttendanceResponseDto {
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
		description: 'Identificador del curso al que pertenece la materia',
		example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
	})
	readonly courseId!: string;

	@ApiProperty({
		description: 'Fecha de la clase',
		example: '2026-03-10',
	})
	readonly date!: string;

	@ApiProperty({
		description: 'Registros de asistencia de los estudiantes de la materia',
		type: [AttendanceRecordResponseDto],
	})
	readonly records!: AttendanceRecordResponseDto[];

	@ApiProperty({
		description: 'Métricas de asistencia calculadas para la clase',
		type: 'object',
		example: {
			totalStudents: 30,
			present: 24,
			absent: 3,
			late: 2,
			justified: 1,
		},
	})
	readonly metrics!: {
		totalStudents: number;
		present: number;
		absent: number;
		late: number;
		justified: number;
	};

	constructor(data: {
		subjectId: string;
		subjectName: string;
		courseId: string;
		date: string;
		records: AttendanceRecordResponseDto[];
	}) {
		this.subjectId = data.subjectId;
		this.subjectName = data.subjectName;
		this.courseId = data.courseId;
		this.date = data.date;
		this.records = data.records;
		this.metrics = {
			totalStudents: data.records.length,
			present: data.records.filter((r) => r.status === 'present').length,
			absent: data.records.filter((r) => r.status === 'absent').length,
			late: data.records.filter((r) => r.status === 'late').length,
			justified: data.records.filter((r) => r.status === 'justified').length,
		};
	}
}
