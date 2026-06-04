import { Injectable } from '@nestjs/common';
import { PaginatedResponse } from '@repo/common';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { StudentDetailResponseDto } from '../../dtos/student-detail.response.dto';
import { SearchStudentsQuery } from './search-students.query';

@Injectable()
export class SearchStudentsHandler {
	constructor(private readonly studentsRepo: IStudentRepository) {}
	async execute(
		query: SearchStudentsQuery,
	): Promise<PaginatedResponse<StudentDetailResponseDto>> {
		const students = await this.studentsRepo.search(query);
		return {
			...students,
			items: students.items.map((s) => new StudentDetailResponseDto(s)),
		};
	}
}
