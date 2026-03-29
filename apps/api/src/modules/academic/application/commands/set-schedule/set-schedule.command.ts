import { DAYOFWEEK } from '@repo/common';

interface Slot {
	dayOfWeek: DAYOFWEEK;
	startTime: string;
	endTime: string;
}

export class SetScheduleCommand {
	constructor(
		readonly subjectId: string,
		readonly slots: Slot[],
	) {}
}
