export enum SUBJECT_KIND {
	THEORY = 'theory',
	WORKSHOP = 'workshop',
}

export type SubjectKindType = (typeof SUBJECT_KIND)[keyof typeof SUBJECT_KIND];

/** Workshop commissions per course (technical schools): always exactly two. */
export const COMMISSION_NUMBERS = [1, 2] as const;
export type CommissionNumber = (typeof COMMISSION_NUMBERS)[number];
