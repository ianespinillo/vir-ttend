import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../../common/errors';
import { IUserRepository } from '../../../../identity/domain/repositories/user.repository.interface';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { CourseResponseDto } from '../../dtos/course.response.dto';
import { SetCourseStatusCommand } from './set-course-status.command';

/**
 * Reversibly activates or deactivates a course. Only the course flag changes:
 * subjects, schedule slots and students are left untouched.
 */
@Injectable()
export class SetCourseStatusHandler {
	constructor(
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
		@Inject('IUserRepository')
		private readonly userRepo: IUserRepository,
	) {}

	async execute(command: SetCourseStatusCommand): Promise<CourseResponseDto> {
		const course = await this.courseRepo.findById(command.courseId);
		if (!course || course.tenantId !== command.tenantId) {
			throw new NotFoundError('Curso no encontrado');
		}
		if (command.isActive) course.activate();
		else course.deactivate();
		await this.courseRepo.save(course);
		const preceptor = course.preceptorId
			? await this.userRepo.findById(course.preceptorId)
			: null;
		return new CourseResponseDto(course, preceptor?.fullName ?? 'Sin asignar');
	}
}
