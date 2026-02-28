import { PrimaryKey, Property } from '@mikro-orm/core';

export abstract class BaseEntity {
	@PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
	id!: string;

	@Property({
		type: 'timestamp',
		defaultRaw: 'now()',
		onCreate: () => new Date(),
	})
	createdAt!: Date;

	@Property({
		type: 'timestamp',
		defaultRaw: 'now()',
		onUpdate: () => new Date(),
	})
	updatedAt!: Date;
}
