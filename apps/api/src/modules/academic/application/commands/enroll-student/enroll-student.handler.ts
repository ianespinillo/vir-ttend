import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IStudentRepository } from '../../../domain/repositories/student.repository.interface';
import { EnrollStudentCommand } from './enroll-student.command';

@Injectable()
export class EnrollStudentHandler {
	constructor(
		private readonly studentRepo: IStudentRepository,
		private readonly courseRepo: ICourseRepository,
	) {}
	async execute(command: EnrollStudentCommand) {
		const student = await this.studentRepo.findById(command.studentId);
		if (!student) throw new NotFoundException('Student not found');

		const course = await this.courseRepo.findById(command.courseId);
		if (!course) throw new NotFoundException('Course not found');

		if (student.courseId === command.courseId) {
			throw new BadRequestException('Student is already enrolled in this course');
		}
		student.transfer(command.courseId);
		await this.studentRepo.save(student);
	}
}
