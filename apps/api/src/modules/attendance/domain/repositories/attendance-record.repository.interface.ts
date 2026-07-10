import { AttendanceRecord } from '../entities/attendance-record.entity';

export interface RawCourseMetrics {
	courseId: string;
	totalStudents: number;
	presents: number;
	absents: number;
	late: number;
	justified: number;
}

export interface IAttendanceRecordRepository {
	findById(id: string): Promise<AttendanceRecord | null>;

	findByCourseAndDate(courseId: string, date: Date): Promise<AttendanceRecord[]>;

	findByStudentAndCourseAndDate(
		courseId: string,
		studentId: string,
		date: Date,
	): Promise<AttendanceRecord | null>;

	findByDateRange(from: Date, to: Date): Promise<AttendanceRecord[]>;

	findByStudentAndDateRange(
		id: string,
		from: Date,
		to: Date,
	): Promise<AttendanceRecord[]>;

	findByCourseAndRange(
		courseId: string,
		from: Date,
		to: Date,
	): Promise<AttendanceRecord[]>;
	findBySubject(subjectId: string): Promise<AttendanceRecord[]>;
	findBySubjectAndDate(
		subjectId: string,
		date: Date,
	): Promise<AttendanceRecord[]>;
	findBySubjectAndDateRange(
		subjectId: string,
		from: Date,
		to: Date,
	): Promise<AttendanceRecord[]>;
	findRecordsOfLastSubjectClass(
		subjectId: string,
		beforeDate: Date,
	): Promise<AttendanceRecord[]>;
	bulkSave(records: AttendanceRecord[]): Promise<void>;

	save(record: AttendanceRecord): Promise<void>;
	getCourseSummaryForDate(
		courseId: string,
		date: Date,
	): Promise<RawCourseMetrics>;
	getCourseSummaryForDateRange(
		courseId: string,
		from: Date,
		to: Date,
	): Promise<RawCourseMetrics>;
}
