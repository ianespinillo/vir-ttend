import { Entity, Index, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { WorkshopSessionNotHeldRepository } from '../repository/workshop-session-not-held.repository';

// FK workshop_commission_id -> workshop_commissions (ON DELETE CASCADE) is
// declared in the migration.
@Entity({
	tableName: 'workshop_session_not_held',
	repository: () => WorkshopSessionNotHeldRepository,
})
@Unique({
	name: 'workshop_session_not_held_commission_date_unique',
	properties: ['workshopCommissionId', 'date'],
})
@Index({ properties: ['workshopCommissionId', 'date'] })
export class WorkshopSessionNotHeldOrmEntity {
	@PrimaryKey({ type: 'uuid' })
	id!: string;

	@Property({ type: 'uuid' })
	tenantId!: string;

	@Property({ type: 'uuid' })
	workshopCommissionId!: string;

	@Property({ type: 'date' })
	date!: Date;

	@Property({ type: 'text', nullable: true })
	reason?: string | null;

	@Property({ type: 'uuid' })
	createdBy!: string;

	@Property({ type: 'timestamptz' })
	createdAt!: Date;
}
