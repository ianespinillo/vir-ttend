import { randomUUID } from 'node:crypto';
import { AcademicYearId } from '../value-objects/academic-year-id.vo';

export interface CreateProps {
	tenantId: string;
	year: number;
	startDate: Date;
	endDate: Date;
	nonWorkingDays: Date[];
	absenceThresholdPercent?: number;
	lateCountAbscenseAfterMinutes?: number;
}

interface ConstructorProps {
	id: AcademicYearId;
	tenantId: string;
	year: number;
	startDate: Date;
	endDate: Date;
	nonWorkingDays: Date[];
	absenceThresholdPercent: number;
	lateCountAbscenseAfterMinutes: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface ReconstituteProps {
	id: string;
	tenantId: string;
	year: number;
	startDate: Date;
	endDate: Date;
	nonWorkingDays: Date[];
	absenceThresholdPercent: number;
	lateCountAbscenseAfterMinutes: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export class AcademicYear {
	private readonly _id: AcademicYearId;
	private readonly _tenantId: string;
	private _year: number;
	private _startDate: Date;
	private _endDate: Date;
	private _nonWorkingDays: Date[];
	private _absenceThresholdPercent: number;
	private _lateCountAbscenseAfterMinutes: number;
	private _isActive: boolean;
	private readonly _createdAt: Date;
	private _updatedAt: Date;

	private constructor(props: ConstructorProps) {
		this._id = props.id;
		this._tenantId = props.tenantId;
		this._year = props.year;
		this._startDate = props.startDate;
		this._endDate = props.endDate;
		this._nonWorkingDays = props.nonWorkingDays;
		this._absenceThresholdPercent = props.absenceThresholdPercent;
		this._lateCountAbscenseAfterMinutes = props.lateCountAbscenseAfterMinutes;
		this._isActive = props.isActive;
		this._createdAt = props.createdAt;
		this._updatedAt = props.updatedAt;
	}

	static create(props: CreateProps): AcademicYear {
		return new AcademicYear({
			id: new AcademicYearId(randomUUID()),
			tenantId: props.tenantId,
			year: props.year,
			startDate: props.startDate,
			endDate: props.endDate,
			nonWorkingDays: props.nonWorkingDays ?? [],
			absenceThresholdPercent: props.absenceThresholdPercent ?? 75,
			lateCountAbscenseAfterMinutes: props.lateCountAbscenseAfterMinutes ?? 15,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}

	static reconstitute(props: ReconstituteProps): AcademicYear {
		return new AcademicYear({
			...props,
			id: new AcademicYearId(props.id),
		});
	}

	// Getters
	get id(): AcademicYearId {
		return this._id;
	}
	get tenantId(): string {
		return this._tenantId;
	}
	get year(): number {
		return this._year;
	}
	get startDate(): Date {
		return this._startDate;
	}
	get endDate(): Date {
		return this._endDate;
	}
	get nonWorkingDays(): Date[] {
		return this._nonWorkingDays;
	}
	get absenceThresholdPercent(): number {
		return this._absenceThresholdPercent;
	}
	get lateCountAbscenseAfterMinutes(): number {
		return this._lateCountAbscenseAfterMinutes;
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

	// Métodos de mutación
	changeYear(year: number): void {
		if (year < new Date().getFullYear()) {
			throw new Error('Year must be greater than or equal to current year');
		}
		this._year = year;
		this._updatedAt = new Date();
	}

	changeYearLapse(startDate: Date, endDate: Date): void {
		if (startDate >= endDate) {
			throw new Error('Start date must be before end date');
		}
		this._startDate = startDate;
		this._endDate = endDate;
		this._updatedAt = new Date();
	}

	addNonWorkingDay(date: Date): void {
		const exists = this._nonWorkingDays.some(
			(d) => d.getTime() === date.getTime(),
		);
		if (exists) return;
		this._nonWorkingDays = [...this._nonWorkingDays, date];
		this._updatedAt = new Date();
	}

	removeNonWorkingDay(date: Date): void {
		this._nonWorkingDays = this._nonWorkingDays.filter(
			(d) => d.getTime() !== date.getTime(),
		);
		this._updatedAt = new Date();
	}

	updateThresholds(
		absenceThresholdPercent?: number,
		lateCountAbscenseAfterMinutes?: number,
	): void {
		if (absenceThresholdPercent !== undefined) {
			if (absenceThresholdPercent < 0 || absenceThresholdPercent > 100) {
				throw new Error('Absence threshold must be between 0 and 100');
			}
			this._absenceThresholdPercent = absenceThresholdPercent;
		}
		if (lateCountAbscenseAfterMinutes !== undefined) {
			if (lateCountAbscenseAfterMinutes < 0) {
				throw new Error('Late count minutes must be positive');
			}
			this._lateCountAbscenseAfterMinutes = lateCountAbscenseAfterMinutes;
		}
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
