import { ReportPeriod } from '../../domain/value-objects/report-period.vo';

export class AvailableReportsResponseDto {
	readonly courseId: string;
	readonly months: ReportPeriod[];
	constructor(courseId: string, months: ReportPeriod[]) {
		this.courseId = courseId;
		this.months = months;
	}
}
