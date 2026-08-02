import { Announcement } from '../../domain/entities/announcement.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { AnnouncementResponseDto } from './announcement.response.dto';

export class AnnouncementDtoMapper {
	static toResponse(
		announcement: Announcement,
		authorName: string,
	): AnnouncementResponseDto {
		return new AnnouncementResponseDto(
			announcement.id.getRaw(),
			announcement.title,
			announcement.body,
			announcement.target.type,
			announcement.target.id,
			announcement.status,
			announcement.publishAt,
			authorName,
			announcement.createdAt,
		);
	}

	static async toResponseList(
		userRepo: IUserRepository,
		announcements: Announcement[],
	): Promise<AnnouncementResponseDto[]> {
		if (announcements.length === 0) return [];
		const authorIds = [...new Set(announcements.map((a) => a.authorId))];
		const names = new Map<string, string>();
		for (const id of authorIds) {
			const user = await userRepo.findById(id);
			names.set(id, user?.fullName ?? 'Desconocido');
		}
		return announcements.map((a) =>
			AnnouncementDtoMapper.toResponse(a, names.get(a.authorId) ?? 'Desconocido'),
		);
	}
}
