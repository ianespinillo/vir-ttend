import { Inject, Injectable } from '@nestjs/common';
import { STUDENTSTATUS } from '@repo/common';
import { ConflictError, NotFoundError } from '../../../../../common/errors';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { TransferStudentCommand } from './transer-student.command';

@Injectable()
export class TransferStudentHandler {
	constructor(
		@Inject('IStudentRepository')
		private readonly studentRepo: IStudentRepository,
	) {}
	async execute(command: TransferStudentCommand) {
		const student = await this.studentRepo.findById(command.studentId);
		if (!student) throw new NotFoundError('Estudiante no encontrado');

		if (student.status === STUDENTSTATUS.INACTIVE) {
			throw new ConflictError('El estudiante ya está inactivo.');
		}
		if (student.status === STUDENTSTATUS.TRANSFERRED) {
			throw new ConflictError('El estudiante ya fue transferido.');
		}
		student.transferAway();
		// TODO: Log transfer reason and other details
		await this.studentRepo.save(student);
	}
}
