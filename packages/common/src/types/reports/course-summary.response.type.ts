export interface CourseSummaryEntry {
	month: number;
	year: number;
	/** Null when no class was given that month. */
	averageAttendance: number | null;
}

export interface CourseSummary {
	courseId: string;
	academicYearId: string;
	months: CourseSummaryEntry[];
}
