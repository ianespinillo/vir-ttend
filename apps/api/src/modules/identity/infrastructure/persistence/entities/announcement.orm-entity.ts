import { Entity, Index, Property } from '@mikro-orm/core';
import { BaseEntity } from '../../../../shared/database/entities/base.entity';
import { AnnouncementStatus } from '../../../domain/entities/announcement.entity';
import { AnnouncementTargetType } from '../../../domain/value-objects/announcement-target.value-object';
import { AnnouncementRepository } from '../repositories/announcement.repository';

@Entity({
	tableName: 'announcements',
	repository: () => AnnouncementRepository,
})
@Index({ properties: ['schoolId', 'status', 'publishAt'] })
export class AnnouncementOrmEntity extends BaseEntity {
	@Property({ type: 'uuid' })
	schoolId!: string;

	@Property({ type: 'uuid' })
	tenantId!: string;

	@Property({ type: 'uuid' })
	authorId!: string;

	@Property()
	title!: string;

	@Property({ type: 'text' })
	body!: string;

	@Property({ type: 'string' })
	targetType!: AnnouncementTargetType;

	@Property({ nullable: true })
	targetId!: string | null;

	@Property({ type: 'string' })
	status!: AnnouncementStatus;

	@Property({ type: 'timestamp', nullable: true })
	publishAt!: Date | null;
}
