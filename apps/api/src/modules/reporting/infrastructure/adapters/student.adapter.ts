import { Inject, Injectable } from '@nestjs/common';
import { IStudentRepository } from '../../../academic/domain/repositories/student.repository.interface';
import { Student } from '../../domain/entities/student.entity';
import { IStudentPort } from '../../domain/ports/student.port.interface';

@Injectable()
export class StudentAdapter implements IStudentPort {
	constructor(
		@Inject('IStudentRepository')
		private readonly studentRepo: IStudentRepository,
	) {}
	async findStudent(studentId: string): Promise<Student | null> {
		const student = await this.studentRepo.findById(studentId);
		if (!student) return null;
		return Student.reconstitute({
			id: student.id,
			name: student.fullName,
			documentNumber: student.documentNumber.getValue(),
		});
	}
}
