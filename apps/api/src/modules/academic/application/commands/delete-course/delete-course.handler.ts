import { Injectable } from '@nestjs/common';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { DeleteCourseCommand } from './delete-course.command';

@Injectable()
export class DeleteCourseHandler {
	constructor(private readonly courseRepo: ICourseRepository) {}
	async execute(command: DeleteCourseCommand) {
		const course = await this.courseRepo.findById(command.courseId);
		if (!course) throw new Error('Course not found');
		// TODO: Sprint 05 — verificar que no tenga asistencias antes de eliminar
		// await attendanceRepository.existsByCourse(courseId)
		course.deactivate();
		await this.courseRepo.save(course);
	}
}
