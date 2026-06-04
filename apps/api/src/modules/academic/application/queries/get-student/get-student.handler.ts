import { Injectable, NotFoundException } from '@nestjs/common';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { StudentDetailResponseDto } from '../../dtos/student-detail.response.dto';
import { GetStudentQuery } from './get-student.query';

@Injectable()
export class GetStudentHandler {
	constructor(private readonly studentRepo: IStudentRepository) {}
	async execute(query: GetStudentQuery): Promise<StudentDetailResponseDto> {
		const student = await this.studentRepo.findById(query.id);
		if (!student) {
			throw new NotFoundException('Student not found');
		}
		return new StudentDetailResponseDto(student);
	}
}
