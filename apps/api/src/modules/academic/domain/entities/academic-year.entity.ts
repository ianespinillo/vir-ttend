import { randomUUID } from 'node:crypto';
import { SHIFT } from '@repo/common';
import { DomainError } from '../../../../common/errors';
import { AcademicYearId } from '../value-objects/academic-year-id.vo';

/** Shift scope of the non-working days, keyed by `YYYY-MM-DD`. A missing key means the whole day. */
export type NonWorkingDayShifts = Record<string, SHIFT[]>;

export interface CreateProps {
	tenantId: string;
	year: number;
	startDate: Date;
	endDate: Date;
	nonWorkingDays: Date[];
	nonWorkingDayShifts?: NonWorkingDayShifts;
	absenceThresholdPercent?: number;
	lateCountAbscenseAfterMinutes?: number;
	isActive?: boolean;
}

interface ConstructorProps {
	id: AcademicYearId;
	tenantId: string;
	year: number;
	startDate: Date;
	endDate: Date;
	nonWorkingDays: Date[];
	nonWorkingDayShifts: NonWorkingDayShifts;
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
	nonWorkingDayShifts?: NonWorkingDayShifts;
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
	private _nonWorkingDayShifts: NonWorkingDayShifts;
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
		this._nonWorkingDayShifts = props.nonWorkingDayShifts;
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
			nonWorkingDayShifts: props.nonWorkingDayShifts ?? {},
			absenceThresholdPercent: props.absenceThresholdPercent ?? 75,
			lateCountAbscenseAfterMinutes: props.lateCountAbscenseAfterMinutes ?? 15,
			isActive: props.isActive ?? true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}

	static reconstitute(props: ReconstituteProps): AcademicYear {
		return new AcademicYear({
			...props,
			nonWorkingDayShifts: props.nonWorkingDayShifts ?? {},
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
	get nonWorkingDayShifts(): NonWorkingDayShifts {
		return this._nonWorkingDayShifts;
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
		if (year < 2020) {
			throw new DomainError('El año debe ser 2020 o posterior.');
		}
		this._year = year;
		this._updatedAt = new Date();
	}

	changeYearLapse(startDate: Date, endDate: Date): void {
		if (new Date(startDate).getTime() >= new Date(endDate).getTime()) {
			throw new DomainError(
				'La fecha de inicio debe ser anterior a la fecha de fin.',
			);
		}
		this._startDate = new Date(startDate);
		this._endDate = new Date(endDate);
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

	/**
	 * Declares a class suspension. Unlike `addNonWorkingDay` it is authoritative
	 * for the scope: empty or missing `shifts` means every shift, and declaring
	 * an already registered day replaces its scope.
	 */
	declareNonWorkingDay(date: Date, shifts?: SHIFT[]): void {
		this.addNonWorkingDay(date);
		const key = AcademicYear.toDayKey(date);
		const scope = [...new Set(shifts ?? [])];
		const next = { ...this._nonWorkingDayShifts };
		if (scope.length > 0) next[key] = scope;
		else delete next[key];
		this._nonWorkingDayShifts = next;
		this._updatedAt = new Date();
	}

	removeNonWorkingDay(date: Date): void {
		this._nonWorkingDays = this._nonWorkingDays.filter(
			(d) => d.getTime() !== date.getTime(),
		);
		const next = { ...this._nonWorkingDayShifts };
		delete next[AcademicYear.toDayKey(date)];
		this._nonWorkingDayShifts = next;
		this._updatedAt = new Date();
	}

	/**
	 * Whether `date` is a non-working day for a course of the given shift. A day
	 * without a shift scope suspends every shift; with a scope it only suspends
	 * the listed ones. Without a `shift` any suspension of the day counts.
	 */
	isNonWorkingDayFor(date: Date, shift?: SHIFT): boolean {
		const key = AcademicYear.toDayKey(date);
		if (!this._nonWorkingDays.some((d) => AcademicYear.toDayKey(d) === key)) {
			return false;
		}
		const scope = this._nonWorkingDayShifts[key];
		if (!scope || scope.length === 0 || shift === undefined) return true;
		return scope.includes(shift);
	}

	/** Days may come back from the database as ISO strings instead of dates. */
	private static toDayKey(date: Date | string): string {
		if (typeof date === 'string') return date.slice(0, 10);
		return date.toISOString().slice(0, 10);
	}

	updateThresholds(
		absenceThresholdPercent?: number,
		lateCountAbscenseAfterMinutes?: number,
	): void {
		if (absenceThresholdPercent !== undefined) {
			if (absenceThresholdPercent < 0 || absenceThresholdPercent > 100) {
				throw new DomainError(
					'El umbral de inasistencias debe estar entre 0 y 100.',
				);
			}
			this._absenceThresholdPercent = absenceThresholdPercent;
		}
		if (lateCountAbscenseAfterMinutes !== undefined) {
			if (lateCountAbscenseAfterMinutes < 0) {
				throw new DomainError('Los minutos de tardanza no pueden ser negativos.');
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
