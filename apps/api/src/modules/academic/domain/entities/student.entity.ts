import { randomUUID } from 'node:crypto';
import { STUDENTSTATUS, StudentStatus } from '@repo/common';
import { Email } from '../../../identity/domain/value-objects/email.vo';
import { DocumentNumber } from '../value-objects/document-number.vo';
import { Tutor } from '../value-objects/tutor.vo';

interface CreateProps {
	courseId: string;
	tenantId: string;
	firstName: string;
	lastName: string;
	documentNumber: string;
	birthDate: Date;
	tutorName: string;
	tutorPhone: string;
	tutorEmail?: string;
}

export interface ReconstituteProps {
	id: string;
	courseId: string;
	tenantId: string;
	firstName: string;
	lastName: string;
	documentNumber: string;
	birthDate: Date;
	tutorName: string;
	tutorPhone: string;
	tutorEmail?: string;
	status: StudentStatus;
	createdAt: Date;
	updatedAt: Date;
}

interface ConstructorProps {
	id: string;
	courseId: string;
	tenantId: string;
	firstName: string;
	lastName: string;
	documentNumber: DocumentNumber;
	birthDate: Date;
	tutor: Tutor;
	status: StudentStatus;
	createdAt: Date;
	updatedAt: Date;
}

export class Student {
	private readonly _id: string;
	private readonly _tenantId: string;
	private _courseId: string;
	private _firstName: string;
	private _lastName: string;
	private readonly _documentNumber: DocumentNumber;
	private _birthDate: Date;
	private _tutorName: string;
	private _tutorPhone: string;
	private _tutorEmail?: string;
	private _status: StudentStatus;
	private readonly _createdAt: Date;
	private _updatedAt: Date;

	private constructor(props: ConstructorProps) {
		this._id = props.id;
		this._tenantId = props.tenantId;
		this._courseId = props.courseId;
		this._firstName = props.firstName;
		this._lastName = props.lastName;
		this._documentNumber = props.documentNumber;
		this._birthDate = props.birthDate;
		this._tutorName = props.tutor.firstName.concat(' ', props.tutor.lastName);
		this._tutorPhone = props.tutor.phone;
		this._tutorEmail = props.tutor.email?.getValue() ?? undefined;
		this._status = props.status;
		this._createdAt = props.createdAt;
		this._updatedAt = props.updatedAt;
	}

	static create(props: CreateProps): Student {
		return new Student({
			...props,
			id: randomUUID(),
			documentNumber: new DocumentNumber(props.documentNumber),
			status: STUDENTSTATUS.ACTIVE,
			createdAt: new Date(),
			updatedAt: new Date(),
			tutor: new Tutor(
				props.tutorName.split(' ')[0],
				props.tutorName.split(' ')[1],
				props.tutorPhone,
				props.tutorEmail ? new Email(props.tutorEmail) : undefined,
			),
		});
	}

	static reconstitute(props: ReconstituteProps): Student {
		return new Student({
			...props,
			documentNumber: new DocumentNumber(props.documentNumber),
			tutor: new Tutor(
				props.tutorName.split(' ')[0],
				props.tutorName.split(' ')[1],
				props.tutorPhone,
				props.tutorEmail ? new Email(props.tutorEmail) : undefined,
			),
		});
	}

	// Getters
	get id(): string {
		return this._id;
	}
	get tenantId(): string {
		return this._tenantId;
	}
	get courseId(): string {
		return this._courseId;
	}
	get firstName(): string {
		return this._firstName;
	}
	get lastName(): string {
		return this._lastName;
	}
	get fullName(): string {
		return `${this._lastName}, ${this._firstName}`;
	}
	get documentNumber(): DocumentNumber {
		return this._documentNumber;
	}
	get birthDate(): Date {
		return this._birthDate;
	}
	get tutorName(): string {
		return this._tutorName;
	}
	get tutorPhone(): string {
		return this._tutorPhone;
	}
	get tutorEmail(): string | undefined {
		return this._tutorEmail;
	}
	get status(): StudentStatus {
		return this._status;
	}
	get createdAt(): Date {
		return this._createdAt;
	}
	get updatedAt(): Date {
		return this._updatedAt;
	}

	get age(): number {
		const today = new Date();
		const age = today.getFullYear() - this._birthDate.getFullYear();
		const monthDiff = today.getMonth() - this._birthDate.getMonth();
		if (
			monthDiff < 0 ||
			(monthDiff === 0 && today.getDate() < this._birthDate.getDate())
		) {
			return age - 1;
		}
		return age;
	}

	// Métodos de mutación
	updatePersonalInfo(
		firstName?: string,
		lastName?: string,
		birthDate?: Date,
	): void {
		if (firstName) this._firstName = firstName;
		if (lastName) this._lastName = lastName;
		if (birthDate) this._birthDate = birthDate;
		if (firstName || lastName || birthDate) this._updatedAt = new Date();
	}

	updateTutorInfo(
		tutorName?: string,
		tutorPhone?: string,
		tutorEmail?: string,
	): void {
		if (tutorEmail) this._tutorEmail = tutorEmail;
		if (tutorName) this._tutorName = tutorName;
		if (tutorPhone) this._tutorPhone = tutorPhone;
		if (tutorName || tutorPhone || tutorEmail) this._updatedAt = new Date();
	}

	transfer(newCourseId: string): void {
		this._courseId = newCourseId;
		this._status = STUDENTSTATUS.TRANSFERRED;
		this._updatedAt = new Date();
	}

	activate(): void {
		this._status = STUDENTSTATUS.ACTIVE;
		this._updatedAt = new Date();
	}

	deactivate(): void {
		this._status = STUDENTSTATUS.INACTIVE;
		this._updatedAt = new Date();
	}
}
