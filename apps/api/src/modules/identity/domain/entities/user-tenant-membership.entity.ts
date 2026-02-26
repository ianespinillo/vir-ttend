import { randomUUID } from 'node:crypto';
import { Roles } from '@repo/common';

interface ConstructorProps {
	id: string;
	userId: string;
	tenantId: string;
	role: Roles;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export class UserTenantMembership {
	private readonly _id: string;
	private readonly _userId: string;
	private readonly _tenantId: string;
	private _role: Roles;
	private _isActive: boolean;
	private readonly _createdAt: Date;
	private _updatedAt: Date;

	private constructor({
		id,
		tenantId,
		userId,
		role,
		isActive,
		createdAt,
		updatedAt,
	}: Readonly<ConstructorProps>) {
		this._id = id;
		this._userId = userId;
		this._tenantId = tenantId;
		this._role = role;
		this._isActive = isActive;
		this._createdAt = createdAt;
		this._updatedAt = updatedAt;
	}

	static create(
		userId: string,
		tenantId: string,
		role: Roles,
	): UserTenantMembership {
		return new UserTenantMembership({
			userId,
			tenantId,
			role,
			createdAt: new Date(),
			updatedAt: new Date(),
			id: randomUUID(),
			isActive: true,
		});
	}
	static reconstitute(props: ConstructorProps): UserTenantMembership {
		return new UserTenantMembership(props);
	}
	deactivate(): void {
		this._isActive = false;
		this._updatedAt = new Date();
	}
	changeRole(role: Roles): void {
		this._role = role;
		this._updatedAt = new Date();
	}
	get id(): string {
		return this._id;
	}
	get tenantId(): string {
		return this._tenantId;
	}
	get userId(): string {
		return this._userId;
	}
	get role(): Roles {
		return this._role;
	}
	get isActive(): boolean {
		return this._isActive;
	}
	get createdAt(): Date {
		return this._createdAt;
	}
	get updatedAt(): Date {
		return this._updatedAt;
	}
}
