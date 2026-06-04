import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { STUDENTSTATUS } from '@repo/common';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { DeleteStudentCommand } from './delete-student.command';

@Injectable()
export class DeleteStudentHandler {
	constructor(private readonly studentRepo: IStudentRepository) {}
	async execute(command: DeleteStudentCommand) {
		const student = await this.studentRepo.findById(command.studentId);
		if (!student) throw new NotFoundException('Student not found');
		if (student.status === STUDENTSTATUS.INACTIVE)
			throw new BadRequestException('Student already inactive');
		student.deactivate();
		await this.studentRepo.save(student);
	}
}
