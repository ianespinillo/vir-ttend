import { DAYOFWEEK } from '../../constants/day-of-week.enum.js';

export interface IScheduleSlotResponse {
	id: string;
	subjectId: string;
	dayOfWeek: DAYOFWEEK;
	startTime: string;
	endTime: string;
}
