import { Inject, Injectable } from '@nestjs/common';
import { StudentDataModel } from '../../../attendance/application/models/student-data.model';
import { IStudentPort } from '../../../attendance/domain/ports/student.port.interface';
import { IStudentRepository } from '../../domain/repositories/student.repository.interface';

@Injectable()
export class StudentAdapter implements IStudentPort {
	constructor(
		@Inject('IStudentRepository')
		private readonly studentRepository: IStudentRepository,
	) {}
	async getByCourseId(courseId: string): Promise<StudentDataModel[]> {
		const students = await this.studentRepository.findByCourse(courseId);
		return students.map((s) => new StudentDataModel(s.id));
	}
}
