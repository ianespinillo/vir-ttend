import { ApiProperty } from '@nestjs/swagger';
import { Student } from '../../domain/entities/student.entity';
import { StudentDetailResponseDto } from './student-detail.response.dto';
import { StudentResponseDto } from './student.response.dto';

// students-list.response.dto.ts
export class StudentsListResponseDto {
	@ApiProperty({
		type: [StudentDetailResponseDto],
		description: 'Estudiantes de la página actual.',
		example: [
			{
				id: '9f8c6d4b-2a10-4f4e-8c3d-5b1e7a0d9f22',
				fullName: 'González, Sofía',
				firstName: 'Sofía',
				lastName: 'González',
				documentNumber: '45233210',
				birthDate: '2014-03-15T00:00:00.000Z',
				age: 12,
				courseId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
				status: 'ACTIVE',
				tutorName: 'María González',
				tutorPhone: '+54 11 5555-1234',
				tutorEmail: 'maria.gonzalez@example.com',
			},
		],
	})
	items: StudentResponseDto[];

	@ApiProperty({
		type: Number,
		minimum: 0,
		description: 'Total de estudiantes que coinciden con el filtro.',
		example: 45,
	})
	total: number;

	@ApiProperty({
		type: Number,
		minimum: 1,
		description: 'Número de página devuelta.',
		example: 1,
	})
	page: number;

	constructor(students: Student[], total: number, page: number) {
		this.items = students.map((s) => new StudentResponseDto(s));
		this.total = total;
		this.page = page;
	}
}
