import { Injectable } from '@nestjs/common';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { UpdateCourseCommand } from './update-course.command';

@Injectable()
export class UpdateCourseHandler {
	constructor(private readonly courseRepo: ICourseRepository) {}
	async execute(command: UpdateCourseCommand) {
		const course = await this.courseRepo.findById(command.courseId);
		if (!course) throw new Error('Course not found');
		if (command.preceptorId) course.assignPreceptor(command.preceptorId);
		if (command.shift) course.changeShift(command.shift);
		await this.courseRepo.save(course);
	}
}
