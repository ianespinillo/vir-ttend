import { Entity, Property, Unique } from '@mikro-orm/core';
import { BaseEntity } from '../../../../shared/database/entities/base.entity';
import { WorkshopCommissionRepository } from '../repositories/workshop-commission.repository';

// workshop-commission.orm-entity.ts
@Entity({
	tableName: 'workshop_commissions',
	repository: () => WorkshopCommissionRepository,
})
@Unique({ properties: ['courseId', 'number'] })
export class WorkshopCommissionOrmEntity extends BaseEntity {
	@Property() tenantId!: string;
	// FK to courses (ON DELETE CASCADE) is declared in the migration.
	@Property({ type: 'uuid' }) courseId!: string;
	@Property({ type: 'smallint' }) number!: number;
	@Property({ type: 'uuid', nullable: true }) preceptorId: string | null = null;
}
