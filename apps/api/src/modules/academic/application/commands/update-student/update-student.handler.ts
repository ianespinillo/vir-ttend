import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../../common/errors';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { UpdateStudentCommand } from './update-student.command';

@Injectable()
export class UpdateStudentHandler {
	constructor(
		@Inject('IStudentRepository')
		private readonly studentRepo: IStudentRepository,
	) {}
	async execute(command: UpdateStudentCommand) {
		const student = await this.studentRepo.findById(command.studentId);
		if (!student) throw new NotFoundError('Estudiante no encontrado');
		student.updateTutorInfo(
			command.tutorName,
			command.tutorPhone,
			command.tutorEmail,
		);
		student.updatePersonalInfo(
			command.firstName,
			command.lastName,
			command.birthDate,
		);
		await this.studentRepo.save(student);
	}
}
