import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	CommissionNumber,
	ISubjectResponse,
	ISubjectTeacherResponse,
	SUBJECT_KIND,
	SubjectKindType,
} from '@repo/common';
import { Subject } from '../../domain/entities/subject.entity';

// subject.response.dto.ts
export class SubjectTeacherResponseDto implements ISubjectTeacherResponse {
	@ApiProperty({
		type: Number,
		nullable: true,
		enum: [1, 2],
		description:
			'Comisión de taller que dicta el docente; null cuando cubre toda la materia.',
		example: 1,
	})
	commissionNumber: CommissionNumber | null;

	@ApiPropertyOptional({
		type: String,
		description: 'ID del docente con usuario.',
		example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
	})
	teacherId?: string;

	@ApiPropertyOptional({
		type: String,
		description:
			'Nombre del docente: el del usuario asignado o, si no tiene usuario, el nombre cargado a mano.',
		example: 'Juan Pérez',
	})
	teacherName?: string;

	constructor(
		commissionNumber: CommissionNumber | null,
		teacherId?: string,
		teacherName?: string,
	) {
		this.commissionNumber = commissionNumber;
		this.teacherId = teacherId;
		this.teacherName = teacherName;
	}
}

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
		description:
			'Nombre completo del docente a cargo de la materia: el del usuario asignado o, si no tiene usuario, el nombre cargado a mano.',
		example: 'Juan Pérez',
	})
	teacherName?: string;

	@ApiProperty({
		type: [SubjectTeacherResponseDto],
		description:
			'Docentes de la materia: uno para toda la materia (commissionNumber null) o uno por comisión de taller.',
	})
	teachers: SubjectTeacherResponseDto[];

	@ApiProperty({
		type: String,
		description: 'ID del curso al que pertenece la materia.',
		example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
	})
	courseId: string;

	/**
	 * teacherNames maps user ids to display names; an account missing from it
	 * has no resolved name. teacherId / teacherName keep the single-teacher
	 * shape older clients read (whole-subject teacher, else commission 1's).
	 */
	constructor(subject: Subject, teacherNames?: ReadonlyMap<string, string>) {
		this.id = subject.id.getRaw();
		this.courseId = subject.courseId;
		this.name = subject.name;
		this.area = subject.area;
		this.weeklyHours = subject.weeklyHours;
		this.kind = subject.kind;
		this.teachers = subject.teachers.map(
			(a) =>
				new SubjectTeacherResponseDto(
					a.commissionNumber,
					a.teacherId,
					(a.teacherId ? teacherNames?.get(a.teacherId) : undefined) ??
						a.teacherName,
				),
		);
		this.teacherId = this.teachers[0]?.teacherId;
		this.teacherName = this.teachers[0]?.teacherName;
	}
}
