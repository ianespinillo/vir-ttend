import { AttendanceRecord } from '../entities/attendance-record.entity';

export interface RawCourseMetrics {
	totalRecords: string;
	courseId: string;
	totalStudents: string;
	presents: string;
	absents: string;
	late: string;
	justified: string;
}

export interface IAttendanceRecordRepository {
	findById(id: string): Promise<AttendanceRecord | null>;

	/** Records with the given ids (daily and subject), in a single query. */
	findByIds(ids: string[]): Promise<AttendanceRecord[]>;

	findByCourseAndDate(courseId: string, date: Date): Promise<AttendanceRecord[]>;

	/** Daily records only (no subject) of a course for a calendar day. */
	findDailyByCourseAndDate(
		courseId: string,
		date: Date,
	): Promise<AttendanceRecord[]>;

	/** Daily records only (no subject) of a student, `from` to `to` inclusive. */
	findDailyByStudentAndDateRange(
		studentId: string,
		from: Date,
		to: Date,
	): Promise<AttendanceRecord[]>;

	/** Daily records only (no subject) of a course, `from` to `to` inclusive. */
	findDailyByCourseAndDateRange(
		courseId: string,
		from: Date,
		to: Date,
	): Promise<AttendanceRecord[]>;

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

	/**
	 * Deletes the daily records (no subject) of a course for a calendar day,
	 * with their justifications, and returns how many records were removed.
	 * Subject records of that day are never touched.
	 */
	deleteDailyByCourseAndDate(courseId: string, date: Date): Promise<number>;

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
