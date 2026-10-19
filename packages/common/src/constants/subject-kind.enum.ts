export enum SUBJECT_KIND {
	THEORY = 'theory',
	WORKSHOP = 'workshop',
}

export type SubjectKindType = (typeof SUBJECT_KIND)[keyof typeof SUBJECT_KIND];

/** Workshop commission numbers (technical schools): a course has one or two. */
export const COMMISSION_NUMBERS = [1, 2] as const;
export type CommissionNumber = (typeof COMMISSION_NUMBERS)[number];

/** How many workshop commissions a course is split into. */
export const COMMISSION_COUNTS = [1, 2] as const;
export type CommissionCount = (typeof COMMISSION_COUNTS)[number];
/** Count used when none is given: the original 50/50 split into two. */
export const DEFAULT_COMMISSION_COUNT: CommissionCount = 2;
