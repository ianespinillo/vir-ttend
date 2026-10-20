// subject.entity.ts
import { randomUUID } from 'node:crypto';
import { SUBJECT_KIND, SubjectKindType } from '@repo/common';
import { DomainError } from '../../../../common/errors';
import { SubjectId } from '../value-objects/subject-id.vo';

interface CreateProps {
	courseId: string;
	teacherId?: string;
	/** Teacher without a user account; only kept while teacherId is unset. */
	teacherName?: string;
	name: string;
	area: string;
	weeklyHours: number;
	kind?: SubjectKindType;
}

interface ConstructorProps {
	id: SubjectId;
	courseId: string;
	teacherId?: string;
	/** Teacher without a user account; only kept while teacherId is unset. */
	teacherName?: string;
	name: string;
	area: string;
	weeklyHours: number;
	kind: SubjectKindType;
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

export interface ReconstituteProps {
	id: string;
	courseId: string;
	teacherId?: string;
	/** Teacher without a user account; only kept while teacherId is unset. */
	teacherName?: string;
	name: string;
	area: string;
	weeklyHours: number;
	kind?: SubjectKindType;
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

export class Subject {
	private readonly _id: SubjectId;
	private readonly _courseId: string;
	private _teacherId?: string;
	private _teacherName?: string;
	private _name: string;
	private _area: string;
	private _weeklyHours: number;
	private _kind: SubjectKindType;
	private readonly _createdAt: Date;
	private _updatedAt: Date;
	private _deletedAt?: Date;

	private constructor(props: ConstructorProps) {
		this._id = props.id;
		this._courseId = props.courseId;
		this._teacherId = props.teacherId;
		this._teacherName = props.teacherId
			? undefined
			: props.teacherName?.trim() || undefined;
		this._name = props.name;
		this._area = props.area;
		this._weeklyHours = props.weeklyHours;
		this._kind = props.kind;
		this._createdAt = props.createdAt;
		this._updatedAt = props.updatedAt;
		this._deletedAt = props.deletedAt;
	}

	static create(props: CreateProps): Subject {
		if (props.weeklyHours < 1) {
			throw new DomainError('Las horas semanales deben ser al menos 1.');
		}
		return new Subject({
			id: new SubjectId(randomUUID()),
			createdAt: new Date(),
			updatedAt: new Date(),
			...props,
			kind: props.kind ?? SUBJECT_KIND.THEORY,
			deletedAt: undefined,
		});
	}

	static reconstitute(props: ReconstituteProps): Subject {
		return new Subject({
			...props,
			kind: props.kind ?? SUBJECT_KIND.THEORY,
			id: new SubjectId(props.id),
			deletedAt: props.deletedAt,
		});
	}

	get id(): SubjectId {
		return this._id;
	}
	get courseId(): string {
		return this._courseId;
	}
	get teacherId(): string | undefined {
		return this._teacherId;
	}
	get teacherName(): string | undefined {
		return this._teacherName;
	}
	get name(): string {
		return this._name;
	}
	get area(): string {
		return this._area;
	}
	get weeklyHours(): number {
		return this._weeklyHours;
	}
	get kind(): SubjectKindType {
		return this._kind;
	}
	get isWorkshop(): boolean {
		return this._kind === SUBJECT_KIND.WORKSHOP;
	}
	get createdAt(): Date {
		return this._createdAt;
	}
	get updatedAt(): Date {
		return this._updatedAt;
	}
	get deletedAt() {
		return this._deletedAt;
	}

	assignTeacher(teacherId: string): void {
		this._teacherId = teacherId;
		this._teacherName = undefined;
		this._updatedAt = new Date();
	}

	/** Names a teacher who has no user account; an empty name leaves the subject without teacher. */
	assignExternalTeacher(teacherName: string): void {
		this._teacherId = undefined;
		this._teacherName = teacherName.trim() || undefined;
		this._updatedAt = new Date();
	}

	unassignTeacher(): void {
		this._teacherId = undefined;
		this._teacherName = undefined;
		this._updatedAt = new Date();
	}

	updateDetails(
		name?: string,
		area?: string,
		weeklyHours?: number,
		kind?: SubjectKindType,
	): void {
		if (name) this._name = name;
		if (kind) this._kind = kind;
		if (area) this._area = area;
		if (weeklyHours !== undefined) {
			if (weeklyHours < 1)
				throw new DomainError('Las horas semanales deben ser al menos 1.');
			this._weeklyHours = weeklyHours;
		}
		this._updatedAt = new Date();
	}
	equals(otherSubject: Subject): boolean {
		return (
			this._area.trim().toLowerCase() === otherSubject.area.trim().toLowerCase() &&
			this._teacherId === otherSubject.teacherId &&
			this._name.trim().toLowerCase() === otherSubject.name.trim().toLowerCase() &&
			this._courseId === otherSubject.courseId
		);
	}
	softDelete() {
		this._deletedAt = new Date();
		this._updatedAt = new Date();
	}
}
