export enum SHIFT {
	MORNING = 'MORNING',
	AFTERNOON = 'AFTERNOON',
	EVENING = 'EVENING',
}
export type ShiftType = (typeof SHIFT)[keyof typeof SHIFT];
