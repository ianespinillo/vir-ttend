import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../../common/errors';
import { ICoursePort } from '../../../domain/ports/courses.port.interface';
import { IDailySessionNotHeldRepository } from '../../../domain/repositories/daily-session-not-held.repository.interface';
import { UnmarkDailySessionNotHeldCommand } from './unmark-daily-session-not-held.command';

/**
 * Removes the not-held marker of a course for a date, which reopens
 * registration. Idempotent: an unmarked day is a no-op. The records deleted
 * when the day was marked are not restored.
 */
@Injectable()
export class UnmarkDailySessionNotHeldHandler {
	constructor(
		@Inject('IDailySessionNotHeldRepository')
		private readonly notHeldRepo: IDailySessionNotHeldRepository,
		@Inject('ICoursePort')
		private readonly coursePort: ICoursePort,
	) {}

	async execute(command: UnmarkDailySessionNotHeldCommand): Promise<void> {
		const course = await this.coursePort.findById(command.courseId);
		if (!course || course.tenantId !== command.tenantId)
			throw new NotFoundError('Curso no encontrado');
		await this.notHeldRepo.delete(command.courseId, command.date);
	}
}
