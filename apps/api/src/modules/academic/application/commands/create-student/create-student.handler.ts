import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConflictError } from '../../../../../common/errors';
import { Student } from '../../../domain/entities/student.entity';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { WorkshopPlacementService } from '../../services/workshop-placement.service';
import { CreateStudentCommand } from './create-student.command';

@Injectable()
export class CreateStudentHandler {
	constructor(
		@Inject('IStudentRepository')
		private readonly studentRepo: IStudentRepository,
		private readonly em: EventEmitter2,
		private readonly placement: WorkshopPlacementService,
	) {}
	async execute(command: CreateStudentCommand): Promise<Student> {
		const student = await this.studentRepo.findByDocument(
			command.documentNumber,
			command.tenantId,
		);
		if (student)
			throw new ConflictError(
				'Ya existe un estudiante con ese número de documento.',
			);
		const newStudent = Student.create({
			firstName: command.firstName,
			lastName: command.lastName,
			courseId: command.courseId,
			documentNumber: command.documentNumber,
			birthDate: command.birthDate,
			tutorName: command.tutorName,
			tutorPhone: command.tutorPhone,
			tutorEmail: command.tutorEmail,
			tenantId: command.tenantId,
		});
		await this.placement.placeNewStudent(newStudent);
		await this.studentRepo.save(newStudent);
		// TODO: publish event
		this.em.emit('student.created', newStudent);
		return newStudent;
	}
}
