import { Inject, Injectable } from '@nestjs/common';
import { IDailySessionNotHeldRepository } from '../../../domain/repositories/daily-session-not-held.repository.interface';
import { DailySessionNotHeldResponseDto } from '../../dtos/daily-session-not-held.response.dto';
import { GetDailySessionNotHeldQuery } from './get-daily-session-not-held.query';

@Injectable()
export class GetDailySessionNotHeldQueryHandler {
	constructor(
		@Inject('IDailySessionNotHeldRepository')
		private readonly notHeldRepo: IDailySessionNotHeldRepository,
	) {}

	async execute(
		query: GetDailySessionNotHeldQuery,
	): Promise<DailySessionNotHeldResponseDto> {
		const marker = await this.notHeldRepo.findByCourseAndDate(
			query.courseId,
			query.date,
		);
		return new DailySessionNotHeldResponseDto(marker !== null, marker?.reason);
	}
}
