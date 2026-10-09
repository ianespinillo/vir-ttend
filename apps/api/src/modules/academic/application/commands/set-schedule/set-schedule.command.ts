import { DAYOFWEEK } from '@repo/common';

export interface Slot {
	subjectId?: string;
	dayOfWeek: DAYOFWEEK;
	startTime: string;
	endTime: string;
}

export class SetScheduleCommand {
	constructor(
		readonly subjectId: string | undefined,
		readonly slots: Slot[],
		readonly courseId?: string,
	) {}
}
