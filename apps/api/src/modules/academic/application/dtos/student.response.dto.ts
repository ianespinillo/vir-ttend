import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IStudentResponse, STUDENTSTATUS, StudentStatus } from '@repo/common';
import { Student } from '../../domain/entities/student.entity';

// student.response.dto.ts
export class StudentResponseDto implements IStudentResponse {
	@ApiProperty({
		type: String,
		description: 'Identificador único del estudiante.',
		example: '9f8c6d4b-2a10-4f4e-8c3d-5b1e7a0d9f22',
	})
	id: string;

	@ApiProperty({
		type: String,
		description: 'Nombre completo del estudiante.',
		example: 'González, Sofía',
	})
	fullName: string;

	@ApiProperty({
		type: String,
		description: 'Nombre del estudiante.',
		example: 'Sofía',
	})
	firstName: string;

	@ApiProperty({
		type: String,
		description: 'Apellido del estudiante.',
		example: 'González',
	})
	lastName: string;

	@ApiProperty({
		type: String,
		description: 'Número de documento del estudiante.',
		example: '45233210',
	})
	documentNumber: string;

	@ApiProperty({
		type: String,
		format: 'date-time',
		description: 'Fecha de nacimiento del estudiante.',
		example: '2014-03-15T00:00:00.000Z',
	})
	birthDate: Date;

	@ApiProperty({
		type: Number,
		minimum: 0,
		description: 'Edad calculada del estudiante.',
		example: 12,
	})
	age: number;

	@ApiProperty({
		type: String,
		description: 'ID del curso al que pertenece el estudiante.',
		example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
	})
	courseId: string;

	@ApiPropertyOptional({
		type: String,
		description: 'Nombre descriptivo del curso del estudiante.',
		example: '1° A - Mañana',
	})
	courseName?: string;

	@ApiProperty({
		enum: STUDENTSTATUS,
		description: 'Estado del estudiante.',
		example: STUDENTSTATUS.ACTIVE,
	})
	status: StudentStatus;

	constructor(student: Student, courseName?: string) {
		this.id = student.id;
		this.fullName = student.fullName;
		this.firstName = student.firstName;
		this.lastName = student.lastName;
		this.documentNumber = student.documentNumber.getValue();
		this.birthDate = student.birthDate;
		this.age = student.age;
		this.courseId = student.courseId;
		this.courseName = courseName;
		this.status = student.status;
	}
}
