import { Inject, Injectable } from '@nestjs/common';
import { STUDENTSTATUS } from '@repo/common';
import { ConflictError, NotFoundError } from '../../../../../common/errors';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { DeleteStudentCommand } from './delete-student.command';

@Injectable()
export class DeleteStudentHandler {
	constructor(
		@Inject('IStudentRepository')
		private readonly studentRepo: IStudentRepository,
	) {}
	async execute(command: DeleteStudentCommand) {
		const student = await this.studentRepo.findById(command.studentId);
		if (!student) throw new NotFoundError('Estudiante no encontrado');
		if (student.status === STUDENTSTATUS.INACTIVE)
			throw new ConflictError('El estudiante ya está inactivo.');
		student.deactivate();
		await this.studentRepo.save(student);
	}
}
