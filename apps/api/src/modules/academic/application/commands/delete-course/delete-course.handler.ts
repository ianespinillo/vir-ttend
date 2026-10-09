import { Inject, Injectable } from '@nestjs/common';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IScheduleRepository } from '../../../domain/repositories/schedule.repository.interface';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { DeleteCourseCommand } from './delete-course.command';

@Injectable()
export class DeleteCourseHandler {
	constructor(
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
		@Inject('ISubjectRepository')
		private readonly subjectRepo: ISubjectRepository,
		@Inject('IScheduleRepository')
		private readonly scheduleRepo: IScheduleRepository,
	) {}
	async execute(command: DeleteCourseCommand) {
		const course = await this.courseRepo.findById(command.courseId);
		if (!course) throw new Error('Course not found');
		// TODO: Sprint 05 — verificar que no tenga asistencias antes de eliminar
		// await attendanceRepository.existsByCourse(courseId)
		course.deactivate();
		await this.courseRepo.save(course);
		// Cascade: soft-delete the course's subjects and remove their schedule slots.
		const subjects = await this.subjectRepo.findByCourse(command.courseId);
		for (const subject of subjects) {
			subject.softDelete();
			await this.subjectRepo.save(subject);
		}
		await this.scheduleRepo.deleteByCourse(command.courseId);
	}
}
