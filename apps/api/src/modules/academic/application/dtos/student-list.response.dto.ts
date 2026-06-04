import { Student } from '../../domain/entities/student.entity';
import { StudentResponseDto } from './student.response.dto';

// students-list.response.dto.ts
export class StudentsListResponseDto {
	items: StudentResponseDto[];
	total: number;
	page: number;

	constructor(students: Student[], total: number, page: number) {
		this.items = students.map((s) => new StudentResponseDto(s));
		this.total = total;
		this.page = page;
	}
}
