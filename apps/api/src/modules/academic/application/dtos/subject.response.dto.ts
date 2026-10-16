import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ISubjectResponse, SUBJECT_KIND, SubjectKindType } from '@repo/common';
import { Subject } from '../../domain/entities/subject.entity';

// subject.response.dto.ts
export class SubjectResponseDto implements ISubjectResponse {
	@ApiProperty({
		type: String,
		description: 'Identificador único de la materia.',
		example: '550e8400-e29b-41d4-a716-446655440000',
	})
	id: string;

	@ApiProperty({
		type: String,
		description: 'Nombre de la materia.',
		example: 'Matemática',
	})
	name: string;

	@ApiProperty({
		type: String,
		description: 'Área o departamento de la materia.',
		example: 'Ciencias Exactas',
	})
	area: string;

	@ApiProperty({
		type: Number,
		minimum: 1,
		description: 'Carga horaria semanal en horas.',
		example: 5,
	})
	weeklyHours: number;

	@ApiProperty({
		enum: SUBJECT_KIND,
		description: 'Tipo de materia: teórica o de taller.',
		example: SUBJECT_KIND.THEORY,
	})
	kind: SubjectKindType;

	@ApiPropertyOptional({
		type: String,
		description: 'ID del docente a cargo de la materia.',
		example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
	})
	teacherId?: string;

	@ApiPropertyOptional({
		type: String,
		description: 'Nombre completo del docente a cargo de la materia.',
		example: 'Juan Pérez',
	})
	teacherName?: string;

	@ApiProperty({
		type: String,
		description: 'ID del curso al que pertenece la materia.',
		example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
	})
	courseId: string;

	constructor(subject: Subject, teacherName?: string) {
		this.id = subject.id.getRaw();
		this.courseId = subject.courseId;
		this.name = subject.name;
		this.area = subject.area;
		this.weeklyHours = subject.weeklyHours;
		this.kind = subject.kind;
		this.teacherId = subject.teacherId;
		this.teacherName = teacherName;
	}
}
