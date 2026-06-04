import { Injectable, NotFoundException } from '@nestjs/common';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { UpdateStudentCommand } from './update-student.command';

@Injectable()
export class UpdateStudentHandler {
	constructor(private readonly studentRepo: IStudentRepository) {}
	async execute(command: UpdateStudentCommand) {
		const student = await this.studentRepo.findById(command.studentId);
		if (!student) throw new NotFoundException('Student not found');
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
