import type { AttendanceRecord } from '../attendance/attendance-record.response.type.js';
import type { CourseSnapshot } from './course-snapshot.type.js';

export interface CourseSnapshotDetail extends CourseSnapshot {
	records: AttendanceRecord[];
}
