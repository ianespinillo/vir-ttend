import { Injectable, NotFoundException } from '@nestjs/common';
import { ATTENDANCE_STATUS } from '@repo/common';
import { AcademicYear } from '../entities/academic-year.entity';
import { AttendanceRecord } from '../entities/attendance-record.entity';
import { ICoursePort } from '../ports/courses.port.interface';
import { IStudentPort } from '../ports/student.port.interface';
import {
	IAttendanceRecordRepository,
	RawCourseMetrics,
} from '../repositories/attendance-record.repository.interface';
import { CourseSnapshot } from '../value-objects/course-snapshot.vo';
import { AttendanceCalculationService } from './attendance-calculation.service';

@Injectable()
export class DashboardService {
	constructor(
		private readonly attendanceRepo: IAttendanceRecordRepository,
		private readonly coursePort: ICoursePort,
	) {}
	public async buildCourseSnapshot(
		courseId: string,
		from: Date,
		to?: Date,
	): Promise<CourseSnapshot> {
		const course = await this.coursePort.findById(courseId);
		if (!course) throw new NotFoundException('Course not found');
		if (to && to !== from) {
			const { justified, late, totalStudents, presents, absents } =
				await this.attendanceRepo.getCourseSummaryForDateRange(courseId, from, to);
			return new CourseSnapshot(
				courseId,
				course.name,
				totalStudents,
				presents,
				absents,
				late,
				justified,
			);
		}
		const { justified, late, totalStudents, presents, absents } =
			await this.attendanceRepo.getCourseSummaryForDate(courseId, from);
		return new CourseSnapshot(
			courseId,
			course.name,
			totalStudents,
			presents,
			absents,
			late,
			justified,
		);
	}
	public buildWeeklyTrend(
		records: AttendanceRecord[],
	): { mondayWeek: Date; percent: number }[] {
		const recordsByWeek = new Map<string, AttendanceRecord[]>();
		for (const record of records) {
			const date = new Date(record.date);
			const day = date.getDay();
			const diff = date.getDate() - day + (day === 0 ? -6 : 1);
			const mondayOfWeek = new Date(date.setDate(diff));
			const key = mondayOfWeek.toISOString();
			if (!recordsByWeek.has(key)) {
				recordsByWeek.set(key, [record]);
			}
			recordsByWeek.get(key)?.push(record);
		}
		const results: { mondayWeek: Date; percent: number }[] = [];
		for (const [monday, records] of recordsByWeek.entries()) {
			results.push({
				mondayWeek: new Date(monday),
				percent:
					(records.filter((r) => r.status === ATTENDANCE_STATUS.PRESENT).length /
						records.length) *
					100,
			});
		}
		return results;
	}
}
