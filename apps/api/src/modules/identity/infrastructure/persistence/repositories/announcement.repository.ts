import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import {
	Announcement,
	AnnouncementStatus,
} from '../../../domain/entities/announcement.entity';
import {
	AnnouncementFilter,
	IAnnouncementRepository,
} from '../../../domain/repositories/announcement.repository.interface';
import { AnnouncementTargetType } from '../../../domain/value-objects/announcement-target.value-object';
import { AnnouncementOrmEntity } from '../entities/announcement.orm-entity';
import { AnnouncementMapper } from '../mappers/announcement.mapper';

@Injectable()
export class AnnouncementRepository implements IAnnouncementRepository {
	constructor(private readonly em: EntityManager) {}

	async findById(id: string): Promise<Announcement | null> {
		const orm = await this.em.findOne(AnnouncementOrmEntity, { id });
		if (!orm) return null;
		return AnnouncementMapper.toDomain(orm);
	}

	async findBySchool(
		schoolId: string,
		filter: AnnouncementFilter = {},
	): Promise<Announcement[]> {
		const where: Record<string, unknown> = { schoolId };
		if (filter.status) where.status = filter.status;
		if (filter.targetType) where.targetType = filter.targetType;
		const orms = await this.em.find(AnnouncementOrmEntity, where, {
			orderBy: { createdAt: 'DESC' },
			limit: filter.limit,
			offset:
				filter.page && filter.page > 1
					? (filter.page - 1) * (filter.limit ?? 20)
					: undefined,
		});
		return orms.map((o) => AnnouncementMapper.toDomain(o));
	}

	async findByTarget(
		schoolId: string,
		targetType: AnnouncementTargetType,
		targetId: string,
	): Promise<Announcement[]> {
		const orms = await this.em.find(AnnouncementOrmEntity, { schoolId, targetType, targetId });
		return orms.map((o) => AnnouncementMapper.toDomain(o));
	}

	async findByAuthor(authorId: string): Promise<Announcement[]> {
		const orms = await this.em.find(AnnouncementOrmEntity, { authorId });
		return orms.map((o) => AnnouncementMapper.toDomain(o));
	}

	async countBySchool(
		schoolId: string,
		status?: AnnouncementStatus,
	): Promise<number> {
		return this.em.count(AnnouncementOrmEntity, status ? { schoolId, status } : { schoolId });
	}

	async save(announcement: Announcement): Promise<void> {
		this.em.persist(AnnouncementMapper.toOrm(announcement));
		await this.em.flush();
	}

	async delete(id: string): Promise<void> {
		const orm = await this.em.findOne(AnnouncementOrmEntity, { id });
		if (orm) {
			await this.em.removeAndFlush(orm);
		}
	}
}
