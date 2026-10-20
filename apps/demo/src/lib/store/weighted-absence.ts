/**
 * Demo store — weighted absence rules.
 *
 * Pure replica of the API rules (apps/api attendance/domain/services/
 * weighted-absence.ts and threshold-checker.service.ts), kept framework-free so
 * the seed generator, the selectors and the store share one source of truth.
 *
 * Institutional counting (PBA Res. 1650/2024, Anexo 4):
 * - a school day never weighs more than 1;
 * - with a contraturno (workshop) shift, each shift weighs 1/2;
 * - justified absences still count;
 * - late = 0.25, late beyond tolerance = 0.5.
 */

import {
	ATTENDANCE_STATUS,
	type AlertType,
	type AttendanceStatus,
} from '@repo/common';
import {
	DEMO_ABSENCE_CAP,
	DEMO_CRITICAL_ABSENCES,
	DEMO_WARNING_ABSENCES,
} from './types';

export const DAILY_ABSENT_WEIGHT = 1;
export const CONTRATURNO_SHIFT_WEIGHT = 0.5;
export const LATE_WEIGHT = 0.25;
export const LATE_BEYOND_TOLERANCE_WEIGHT = 0.5;
export const MAX_DAILY_ABSENCE = 1;

export interface WeightedRecord {
	status: AttendanceStatus | string;
	/** `YYYY-MM-DD`. */
	date: string;
}

export interface WeightedAbsenceResult {
	total: number;
	breakdown: { daily: number; workshop: number };
}

export interface WeightedAbsenceInput {
	/** Daily records only (no subject attendance rows). */
	dailyRecords: readonly WeightedRecord[];
	workshopRecords: readonly WeightedRecord[];
	/**
	 * Workshop-only course (7th year technical): a single shift, so there is no
	 * contraturno halving and a workshop absence weighs 1.
	 */
	workshopOnly?: boolean;
}

function weightOf(status: string, absentWeight: number): number {
	switch (status) {
		case ATTENDANCE_STATUS.ABSENT:
		case ATTENDANCE_STATUS.JUSTIFIED:
			return absentWeight;
		case ATTENDANCE_STATUS.LATE:
			return LATE_WEIGHT;
		case ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE:
			return LATE_BEYOND_TOLERANCE_WEIGHT;
		default:
			return 0;
	}
}

function sumByDay(
	records: readonly WeightedRecord[],
	absentWeightOf: (day: string) => number,
): Map<string, number> {
	const byDay = new Map<string, number>();
	for (const record of records) {
		const day = record.date.slice(0, 10);
		byDay.set(
			day,
			(byDay.get(day) ?? 0) + weightOf(record.status, absentWeightOf(day)),
		);
	}
	return byDay;
}

/**
 * Weighted absence total of one student. A date is a contraturno day only when
 * the student has a workshop record on it; there a daily absence weighs 1/2.
 * Each date is capped at 1, the daily shift being counted first.
 */
export function calculateWeightedAbsences(
	input: WeightedAbsenceInput,
): WeightedAbsenceResult {
	const contraturnoDays = new Set(
		input.workshopOnly
			? []
			: input.workshopRecords.map((record) => record.date.slice(0, 10)),
	);
	const workshopAbsentWeight = input.workshopOnly
		? DAILY_ABSENT_WEIGHT
		: CONTRATURNO_SHIFT_WEIGHT;

	const dailyByDay = sumByDay(input.dailyRecords, (day) =>
		contraturnoDays.has(day) ? CONTRATURNO_SHIFT_WEIGHT : DAILY_ABSENT_WEIGHT,
	);
	const workshopByDay = sumByDay(
		input.workshopRecords,
		() => workshopAbsentWeight,
	);

	let daily = 0;
	let workshop = 0;
	for (const day of new Set([...dailyByDay.keys(), ...workshopByDay.keys()])) {
		const dailyWeight = Math.min(dailyByDay.get(day) ?? 0, MAX_DAILY_ABSENCE);
		daily += dailyWeight;
		workshop += Math.min(
			workshopByDay.get(day) ?? 0,
			MAX_DAILY_ABSENCE - dailyWeight,
		);
	}
	return { total: daily + workshop, breakdown: { daily, workshop } };
}

/** Days effectively given to a student: distinct dates with any record. */
export function countDaysGiven(
	dailyRecords: readonly WeightedRecord[],
	workshopRecords: readonly WeightedRecord[],
): number {
	return new Set(
		[...dailyRecords, ...workshopRecords].map((record) =>
			record.date.slice(0, 10),
		),
	).size;
}

/** Statistic over the days given; null when no class was given. */
export function absencePercentOver(
	total: number,
	daysGiven: number,
): number | null {
	return daysGiven > 0 ? Number(((total / daysGiven) * 100).toFixed(1)) : null;
}

export interface ReachedThreshold {
	threshold: number;
	alertType: AlertType;
}

/**
 * Highest threshold reached by the count, unless an alert of its type already
 * exists. A lower threshold is never raised once a higher one was reached.
 */
export function checkThreshold(
	absenceCount: number,
	existingTypes: ReadonlySet<AlertType>,
	cap: number = DEMO_ABSENCE_CAP,
): ReachedThreshold | null {
	const levels: ReachedThreshold[] = [
		{ threshold: DEMO_WARNING_ABSENCES, alertType: 'warning' },
		{ threshold: DEMO_CRITICAL_ABSENCES, alertType: 'critical' },
		{ threshold: cap, alertType: 'exceeded' },
	];
	let reached: ReachedThreshold | null = null;
	for (const level of levels) {
		if (
			absenceCount >= level.threshold &&
			(!reached || level.threshold >= reached.threshold)
		) {
			reached = level;
		}
	}
	if (!reached) return null;
	return existingTypes.has(reached.alertType) ? null : reached;
}

/** Report band for a weighted count (warning at 10, exceeded at the cap). */
export function absenceCountToReportStatus(
	total: number,
	cap: number = DEMO_ABSENCE_CAP,
): 'ok' | 'at-risk' | 'exceeded' {
	if (total >= cap) return 'exceeded';
	if (total >= DEMO_WARNING_ABSENCES) return 'at-risk';
	return 'ok';
}
