import { Announcement } from '../../../domain/entities/announcement.entity';
import { AnnouncementOrmEntity } from '../entities/announcement.orm-entity';

export class AnnouncementMapper {
	static toDomain(orm: AnnouncementOrmEntity): Announcement {
		return Announcement.reconstitute({
			id: orm.id,
			schoolId: orm.schoolId,
			tenantId: orm.tenantId,
			authorId: orm.authorId,
			title: orm.title,
			body: orm.body,
			targetType: orm.targetType,
			targetId: orm.targetId ?? '',
			status: orm.status,
			publishAt: orm.publishAt ?? null,
			createdAt: orm.createdAt,
			updatedAt: orm.updatedAt,
		});
	}

	static toOrm(entity: Announcement): AnnouncementOrmEntity {
		const orm = new AnnouncementOrmEntity();
		orm.id = entity.id.getRaw();
		orm.schoolId = entity.schoolId;
		orm.tenantId = entity.tenantId;
		orm.authorId = entity.authorId;
		orm.title = entity.title;
		orm.body = entity.body;
		orm.targetType = entity.target.type;
		orm.targetId = entity.target.id || null;
		orm.status = entity.status;
		orm.publishAt = entity.publishAt;
		orm.createdAt = entity.createdAt;
		orm.updatedAt = entity.updatedAt;
		return orm;
	}
}
