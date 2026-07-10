// course-snapshot.dto.ts
import { COURSE_RISK_STATUS } from '@repo/common';

export class CourseSnapshotDto {
	readonly courseId!: string;
	readonly courseName!: string;
	readonly level!: string;
	readonly totalStudents!: number;
	readonly present!: number;
	readonly absent!: number;
	readonly late!: number;
	readonly justified!: number;
	readonly notRecorded!: number;
	readonly absencePercent!: number;
	readonly statusColor!: COURSE_RISK_STATUS;
	readonly lastUpdated!: Date;

	constructor(props: {
		courseId: string;
		courseName: string;
		level: string;
		totalStudents: number;
		present: number;
		absent: number;
		late: number;
		justified: number;
		notRecorded: number;
		absencePercent: number;
		statusColor: COURSE_RISK_STATUS;
		lastUpdated: Date;
	}) {
		Object.assign(this, props);
	}
}
