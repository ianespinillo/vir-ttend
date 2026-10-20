// workshop-commission.entity.ts
import { randomUUID } from 'node:crypto';
import {
	COMMISSION_COUNTS,
	COMMISSION_NUMBERS,
	CommissionCount,
	CommissionNumber,
} from '@repo/common';
import { DomainError } from '../../../../common/errors';
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
 * One of the workshop commissions (one or two) a course is split into
 * (technical schools). Students attend the workshop per commission, in the
 * opposite shift. The number of commissions of a course is the number of rows.
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

	/** Commission numbers to create for a course split into `count` commissions. */
	static numbersFor(count: number): CommissionNumber[] {
		if (!(COMMISSION_COUNTS as readonly number[]).includes(count)) {
			throw new DomainError('La cantidad de comisiones debe ser 1 o 2.');
		}
		return COMMISSION_NUMBERS.slice(0, count as CommissionCount);
	}

	static reconstitute(props: ReconstituteProps): WorkshopCommission {
		return new WorkshopCommission(props);
	}

	private static assertValidNumber(number: number): void {
		if (!(COMMISSION_NUMBERS as readonly number[]).includes(number)) {
			throw new DomainError('La comisión debe ser 1 o 2.');
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
