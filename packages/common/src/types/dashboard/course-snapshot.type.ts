import type { COURSE_RISK_STATUS } from '../../constants/course-risk-status.enum.js';
import type { LevelType } from '../../constants/level.enum.js';

export interface CourseSnapshot {
	courseId: string;
	courseName: string;
	level: LevelType;
	totalStudents: number;
	present: number;
	absent: number;
	late: number;
	justified: number;
	notRecorded: number;
	statusColor: COURSE_RISK_STATUS;
	lastUpdated: Date;
}
