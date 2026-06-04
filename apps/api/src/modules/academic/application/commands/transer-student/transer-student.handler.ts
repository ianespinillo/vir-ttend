import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { TransferStudentCommand } from './transer-student.command';

@Injectable()
export class TransferStudentHandler {
	constructor(
		private readonly studentRepo: IStudentRepository,
		private readonly courseRepo: ICourseRepository,
	) {}
	async execute(command: TransferStudentCommand) {
		const student = await this.studentRepo.findById(command.studentId);
		if (!student) throw new NotFoundException('Student not found');

		const course = await this.courseRepo.findById(command.newCourseId);
		if (!course) throw new NotFoundException('Course not found');

		if (student.courseId === command.newCourseId) {
			throw new BadRequestException('Student is already enrolled in this course');
		}
		student.transfer(command.newCourseId);
		// TODO: Log transfer reason and other details
		await this.studentRepo.save(student);
	}
}
