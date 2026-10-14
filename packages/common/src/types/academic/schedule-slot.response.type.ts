import { DAYOFWEEK } from '../../constants/day-of-week.enum.js';
import type { CommissionNumber } from '../../constants/subject-kind.enum.js';

export interface IScheduleSlotResponse {
	id: string;
	subjectId: string;
	dayOfWeek: DAYOFWEEK;
	startTime: string;
	endTime: string;
	/** 1 | 2 for a single workshop commission; null = both commissions / whole course. */
	commissionNumber?: CommissionNumber | null;
}
