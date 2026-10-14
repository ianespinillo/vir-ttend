import { ApiProperty } from '@nestjs/swagger';
import { CommissionNumber } from '@repo/common';
import { Course } from '../../domain/entities/course.entity';
import { Student } from '../../domain/entities/student.entity';
import { WorkshopCommission } from '../../domain/entities/workshop-commission.entity';
import { WorkshopSplitService } from '../../domain/services/workshop-split.service';

export class WorkshopCommissionStudentDto {
	@ApiProperty({ type: String, description: 'ID del estudiante.' })
	id: string;

	@ApiProperty({ type: String, description: 'Apellido.', example: 'González' })
	lastName: string;

	@ApiProperty({ type: String, description: 'Nombre.', example: 'Sofía' })
	firstName: string;

	constructor(student: Student) {
		this.id = student.id;
		this.lastName = student.lastName;
		this.firstName = student.firstName;
	}
}

export class WorkshopCommissionResponseDto {
	@ApiProperty({ type: String, description: 'ID de la comisión.' })
	id: string;

	@ApiProperty({ type: String, description: 'ID del curso.' })
	courseId: string;

	@ApiProperty({
		type: Number,
		enum: [1, 2],
		description: 'Número de comisión.',
	})
	number: CommissionNumber;

	@ApiProperty({
		type: String,
		description: 'Código de la comisión (año + división + número).',
		example: '141',
	})
	code: string;

	@ApiProperty({
		type: String,
		nullable: true,
		description: 'ID del preceptor de taller (null si no tiene).',
	})
	preceptorId: string | null;

	@ApiProperty({
		type: Number,
		description: 'Cantidad de estudiantes activos.',
	})
	studentCount: number;

	@ApiProperty({
		type: [WorkshopCommissionStudentDto],
		description: 'Estudiantes activos, ordenados alfabéticamente.',
	})
	students: WorkshopCommissionStudentDto[];

	constructor(
		commission: WorkshopCommission,
		course: Pick<Course, 'yearNumber' | 'division'>,
		students: Student[],
	) {
		this.id = commission.id;
		this.courseId = commission.courseId;
		this.number = commission.number;
		this.code = commission.code(course);
		this.preceptorId = commission.preceptorId;
		this.students = WorkshopSplitService.sortAlphabetically(students).map(
			(s) => new WorkshopCommissionStudentDto(s),
		);
		this.studentCount = this.students.length;
	}
}
