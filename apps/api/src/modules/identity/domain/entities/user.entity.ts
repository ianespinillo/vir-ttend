import { randomUUID } from 'node:crypto';
import { Email } from '../value-objects/email.vo';
import { PasswordHashed } from '../value-objects/password-hashed.vo';

interface CreateUser {
	email: string;
	password: PasswordHashed;
	firstName: string;
	lastName: string;
}

export class User {
	private readonly _id: string;
	private readonly _email: Email;
	private readonly _firstName: string;
	private readonly _lastName: string;
	private readonly _createdAt: Date;
	private _password: PasswordHashed;
	private _updatedAt: Date;
	private _isActive: boolean;
	private _mustChangePassword: boolean;

	private constructor(
		id: string,
		email: Email,
		password: PasswordHashed,
		firstName: string,
		lastName: string,
		isActive: boolean,
		mustChangePassword: boolean,
		createdAt: Date,
		updatedAt: Date,
	) {
		this._id = id;
		this._email = email;
		this._password = password;
		this._firstName = firstName;
		this._lastName = lastName;
		this._isActive = isActive;
		this._createdAt = createdAt;
		this._updatedAt = updatedAt;
		this._mustChangePassword = mustChangePassword;
	}

	public static create(props: CreateUser): User {
		return new User(
			randomUUID(),
			new Email(props.email),
			props.password,
			props.firstName,
			props.lastName,
			true,
			true,
			new Date(),
			new Date(),
		);
	}

	static reconstitute(props: {
		id: string;
		email: string;
		passwordHash: string;
		firstName: string;
		lastName: string;
		isActive: boolean;
		createdAt: Date;
		updatedAt: Date;
		mustChangePassword: boolean;
	}): User {
		return new User(
			props.id,
			new Email(props.email),
			new PasswordHashed(props.passwordHash),
			props.firstName,
			props.lastName,
			props.isActive,
			props.mustChangePassword,
			props.createdAt,
			props.updatedAt,
		);
	}
	// Getters
	get email(): string {
		return this._email.getValue();
	}

	get fullName(): string {
		return `${this._firstName} ${this._lastName}`;
	}
	get isActive(): boolean {
		return this._isActive;
	}
	get password(): PasswordHashed {
		return this._password;
	}
	get id(): string {
		return this._id;
	}
	get firstName(): string {
		return this._firstName;
	}
	get lastName(): string {
		return this._lastName;
	}
	get createdAt(): Date {
		return this._createdAt;
	}
	get updatedAt(): Date {
		return this._updatedAt;
	}
	get mustChangePassword(): boolean {
		return this._mustChangePassword;
	}

	changePassword(newPassword: PasswordHashed): void {
		this._password = newPassword;
		this._updatedAt = new Date();
	}
	activate(): void {
		this._isActive = true;
		this._updatedAt = new Date();
	}
	deactivate(): void {
		this._isActive = false;
		this._updatedAt = new Date();
	}
}
