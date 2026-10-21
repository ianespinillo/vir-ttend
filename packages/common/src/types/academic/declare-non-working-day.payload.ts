import type { ShiftType } from '../../constants/shift.enum.js';

export interface IDeclareNonWorkingDayPayload {
	date: string;
	reason: string;
	type?: string;
	notifySchool?: boolean;
	/** Empty or missing = every shift. */
	shifts?: ShiftType[];
}
