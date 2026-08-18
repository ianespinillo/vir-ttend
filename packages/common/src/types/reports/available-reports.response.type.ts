export interface AvailableReportPeriod {
	month: number;
	year: number;
}

export interface AvailableReportsResponse {
	courseId: string;
	periods: AvailableReportPeriod[];
}
