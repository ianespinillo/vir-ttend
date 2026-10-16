export interface IDeclareNonWorkingDayPayload {
	date: string;
	reason: string;
	type?: string;
	notifySchool?: boolean;
}
