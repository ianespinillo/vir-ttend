export interface CourseSummaryEntry {
	month: number;
	year: number;
	averageAttendance: number;
}

export class CourseSummaryResponseDto {
	readonly courseId: string;
	readonly academicYearId: string;
	readonly months: CourseSummaryEntry[];

	constructor(props: {
		courseId: string;
		academicYearId: string;
		months: CourseSummaryEntry[];
	}) {
		this.courseId = props.courseId;
		this.academicYearId = props.academicYearId;
		this.months = props.months;
	}
}
