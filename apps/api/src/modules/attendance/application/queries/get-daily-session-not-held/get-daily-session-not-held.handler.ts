import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../../common/errors';
import { ICoursePort } from '../../../domain/ports/courses.port.interface';
import { IDailySessionNotHeldRepository } from '../../../domain/repositories/daily-session-not-held.repository.interface';
import { DailySessionNotHeldResponseDto } from '../../dtos/daily-session-not-held.response.dto';
import { GetDailySessionNotHeldQuery } from './get-daily-session-not-held.query';

@Injectable()
export class GetDailySessionNotHeldQueryHandler {
	constructor(
		@Inject('IDailySessionNotHeldRepository')
		private readonly notHeldRepo: IDailySessionNotHeldRepository,
		@Inject('ICoursePort')
		private readonly coursePort: ICoursePort,
	) {}

	async execute(
		query: GetDailySessionNotHeldQuery,
	): Promise<DailySessionNotHeldResponseDto> {
		const course = await this.coursePort.findById(query.courseId);
		// A course of another tenant is reported as missing, not forbidden.
		if (!course || course.tenantId !== query.tenantId)
			throw new NotFoundError('Curso no encontrado');
		const marker = await this.notHeldRepo.findByCourseAndDate(
			query.courseId,
			query.date,
		);
		return new DailySessionNotHeldResponseDto(marker !== null, marker?.reason);
	}
}
