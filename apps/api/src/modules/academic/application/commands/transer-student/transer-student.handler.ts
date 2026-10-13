import {
	BadRequestException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { STUDENTSTATUS } from '@repo/common';
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
		if (!student) throw new NotFoundException('Student not found');

		if (student.status === STUDENTSTATUS.INACTIVE) {
			throw new BadRequestException('Student is already inactive');
		}
		if (student.status === STUDENTSTATUS.TRANSFERRED) {
			throw new BadRequestException('Student is already transferred');
		}
		student.transferAway();
		// TODO: Log transfer reason and other details
		await this.studentRepo.save(student);
	}
}
