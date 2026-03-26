// course.entity.ts
import { randomUUID } from 'node:crypto';
import { LEVEL as Level, SHIFT as Shift } from '@repo/common';
import { CourseId } from '../value-objects/course-id.vo';

interface CreateProps {
	tenantId: string;
	academicYearId: string;
	preceptorId: string;
	level: Level;
	yearNumber: number;
	division: string;
	shift: Shift;
}

interface ConstructorProps {
	id: CourseId;
	tenantId: string;
	academicYearId: string;
	preceptorId: string;
	level: Level;
	yearNumber: number;
	division: string;
	shift: Shift;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface ReconstituteProps {
	id: string;
	tenantId: string;
	academicYearId: string;
	preceptorId: string;
	level: Level;
	yearNumber: number;
	division: string;
	shift: Shift;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export class Course {
	private readonly _id: CourseId;
	private readonly _tenantId: string;
	private readonly _academicYearId: string;
	private _preceptorId: string;
	private _level: Level;
	private _yearNumber: number;
	private _division: string;
	private _shift: Shift;
	private _isActive: boolean;
	private readonly _createdAt: Date;
	private _updatedAt: Date;

	private constructor(props: ConstructorProps) {
		this._id = props.id;
		this._tenantId = props.tenantId;
		this._academicYearId = props.academicYearId;
		this._preceptorId = props.preceptorId;
		this._level = props.level;
		this._yearNumber = props.yearNumber;
		this._division = props.division;
		this._shift = props.shift;
		this._isActive = props.isActive;
		this._createdAt = props.createdAt;
		this._updatedAt = props.updatedAt;
	}

	static create(props: CreateProps): Course {
		if (props.yearNumber < 1 || props.yearNumber > 7) {
			throw new Error('Year number must be between 1 and 7');
		}
		return new Course({
			id: new CourseId(randomUUID()),
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			...props,
		});
	}

	static reconstitute(props: ReconstituteProps): Course {
		return new Course({
			...props,
			id: new CourseId(props.id),
		});
	}

	get id(): CourseId {
		return this._id;
	}
	get tenantId(): string {
		return this._tenantId;
	}
	get academicYearId(): string {
		return this._academicYearId;
	}
	get preceptorId(): string {
		return this._preceptorId;
	}
	get level(): Level {
		return this._level;
	}
	get yearNumber(): number {
		return this._yearNumber;
	}
	get division(): string {
		return this._division;
	}
	get shift(): Shift {
		return this._shift;
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

	assignPreceptor(preceptorId: string): void {
		this._preceptorId = preceptorId;
		this._updatedAt = new Date();
	}

	changeShift(shift: Shift): void {
		this._shift = shift;
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
