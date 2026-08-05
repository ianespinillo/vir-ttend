export interface CourseSummaryEntry {
	month: number;
	year: number;
	averageAttendance: number;
}

export interface CourseSummary {
	courseId: string;
	academicYearId: string;
	months: CourseSummaryEntry[];
}
