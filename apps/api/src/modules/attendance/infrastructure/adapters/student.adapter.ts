import { Inject, Injectable } from '@nestjs/common';
import { IStudentRepository } from '../../../academic/domain/repositories/student.repository.interface';
import { Student } from '../../domain/entities/student';
import { IStudentPort } from '../../domain/ports/student.port.interface';

@Injectable()
export class StudentAdapter implements IStudentPort {
	constructor(
		@Inject('IStudentRepository')
		private readonly studentRepository: IStudentRepository,
	) {}
	async getByCourseId(courseId: string): Promise<Student[]> {
		const students = await this.studentRepository.findByCourse(courseId);
		return students.map((s) => Student.reconstitute(s.id, s.fullName));
	}
	async findById(id: string): Promise<Student | null> {
		const student = await this.studentRepository.findById(id);
		if (!student) return null;
		return Student.reconstitute(student.id, student.fullName);
	}
}
