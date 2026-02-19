import { PrimaryKey, Property } from '@mikro-orm/core';

export abstract class BaseEntity {
	@PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
	private readonly _id!: string;

	@Property({
		type: 'timestamp',
		defaultRaw: 'now()',
		onCreate: () => new Date(),
	})
	private readonly _createdAt!: Date;

	@Property({
		type: 'timestamp',
		defaultRaw: 'now()',
		onUpdate: () => new Date(),
	})
	private readonly _updatedAt!: Date;

	get id(): string {
		return this._id;
	}
	get createdAt(): Date {
		return this._createdAt;
	}
	get updatedAt(): Date {
		return this._updatedAt;
	}
}
