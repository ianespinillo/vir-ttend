import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../../common/errors';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { UpdateCourseCommand } from './update-course.command';

@Injectable()
export class UpdateCourseHandler {
	constructor(
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
	) {}
	async execute(command: UpdateCourseCommand) {
		const course = await this.courseRepo.findById(command.courseId);
		if (!course) throw new NotFoundError('Curso no encontrado');
		if (command.preceptorId) course.assignPreceptor(command.preceptorId);
		if (command.shift) course.changeShift(command.shift);
		if (command.division !== undefined) course.changeDivision(command.division);
		if (command.yearNumber !== undefined) course.changeYearNumber(command.yearNumber);
		await this.courseRepo.save(course);
	}
}
