import { CommissionNumber } from '@repo/common';

/**
 * Teacher of a subject for one workshop commission. A null commission number
 * means the teacher covers the whole subject (every commission / whole course).
 * Either a user account (teacherId) or a plain name (teacherName) is kept,
 * never both: the name is only kept while the account is unset.
 */
export interface SubjectTeacherAssignment {
	readonly commissionNumber: CommissionNumber | null;
	readonly teacherId?: string;
	readonly teacherName?: string;
}

/** Which commissions of a subject a teacher teaches; [] when not assigned. */
export type TaughtCommissions = 'all' | CommissionNumber[];

/** Trims the name, drops it when an account is set, and returns null when nothing is left. */
export function normalizeTeacherAssignment(
	assignment: SubjectTeacherAssignment,
): SubjectTeacherAssignment | null {
	const teacherId = assignment.teacherId?.trim() || undefined;
	const teacherName = teacherId
		? undefined
		: assignment.teacherName?.trim() || undefined;
	if (!teacherId && !teacherName) return null;
	return {
		commissionNumber: assignment.commissionNumber ?? null,
		teacherId,
		teacherName,
	};
}
