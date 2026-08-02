import { AnnouncementResponseDto } from './announcement.response.dto';

export class AnnouncementsListResponseDto {
	constructor(
		readonly items: AnnouncementResponseDto[],
		readonly total: number,
		readonly page: number,
	) {}
}
