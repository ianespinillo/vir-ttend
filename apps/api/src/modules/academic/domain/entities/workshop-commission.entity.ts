// workshop-commission.entity.ts
import { randomUUID } from 'node:crypto';
import { COMMISSION_NUMBERS, CommissionNumber } from '@repo/common';
import { Course } from './course.entity';

interface CreateProps {
	tenantId: string;
	courseId: string;
	number: CommissionNumber;
	preceptorId?: string | null;
}

export interface ReconstituteProps extends CreateProps {
	id: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * One of the two workshop commissions a course is split into (technical
 * schools). Students attend the workshop per commission, in the opposite shift.
 */
export class WorkshopCommission {
	private readonly _id: string;
	private readonly _tenantId: string;
	private readonly _courseId: string;
	private readonly _number: CommissionNumber;
	private _preceptorId: string | null;
	private readonly _createdAt: Date;
	private _updatedAt: Date;

	private constructor(props: ReconstituteProps) {
		this._id = props.id;
		this._tenantId = props.tenantId;
		this._courseId = props.courseId;
		this._number = props.number;
		this._preceptorId = props.preceptorId ?? null;
		this._createdAt = props.createdAt;
		this._updatedAt = props.updatedAt;
	}

	/**
	 * Commission code derived from the course: year number + division + commission
	 * number (course 1°4° commission 1 -> "141").
	 */
	static buildCode(
		course: Pick<Course, 'yearNumber' | 'division'>,
		number: CommissionNumber,
	): string {
		return `${course.yearNumber}${course.division}${number}`;
	}

	static create(props: CreateProps): WorkshopCommission {
		WorkshopCommission.assertValidNumber(props.number);
		return new WorkshopCommission({
			...props,
			id: randomUUID(),
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}

	static reconstitute(props: ReconstituteProps): WorkshopCommission {
		return new WorkshopCommission(props);
	}

	private static assertValidNumber(number: number): void {
		if (!(COMMISSION_NUMBERS as readonly number[]).includes(number)) {
			throw new Error('Commission number must be 1 or 2');
		}
	}

	get id(): string {
		return this._id;
	}
	get tenantId(): string {
		return this._tenantId;
	}
	get courseId(): string {
		return this._courseId;
	}
	get number(): CommissionNumber {
		return this._number;
	}
	get preceptorId(): string | null {
		return this._preceptorId;
	}
	get createdAt(): Date {
		return this._createdAt;
	}
	get updatedAt(): Date {
		return this._updatedAt;
	}

	code(course: Pick<Course, 'yearNumber' | 'division'>): string {
		return WorkshopCommission.buildCode(course, this._number);
	}

	assignPreceptor(preceptorId: string | null): void {
		this._preceptorId = preceptorId;
		this._updatedAt = new Date();
	}
}
