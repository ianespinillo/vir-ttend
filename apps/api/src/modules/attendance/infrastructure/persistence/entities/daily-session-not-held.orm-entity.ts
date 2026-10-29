import { Entity, Index, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { DailySessionNotHeldRepository } from '../repository/daily-session-not-held.repository';

// FK course_id -> courses (ON DELETE CASCADE) is declared in the migration.
@Entity({
	tableName: 'daily_session_not_held',
	repository: () => DailySessionNotHeldRepository,
})
@Unique({
	name: 'daily_session_not_held_course_date_unique',
	properties: ['courseId', 'date'],
})
@Index({ properties: ['courseId', 'date'] })
export class DailySessionNotHeldOrmEntity {
	@PrimaryKey({ type: 'uuid' })
	id!: string;

	@Property({ type: 'uuid' })
	tenantId!: string;

	@Property({ type: 'uuid' })
	courseId!: string;

	@Property({ type: 'date' })
	date!: Date;

	@Property({ type: 'text', nullable: true })
	reason?: string | null;

	@Property({ type: 'uuid' })
	createdBy!: string;

	@Property({ type: 'timestamptz' })
	createdAt!: Date;
}
