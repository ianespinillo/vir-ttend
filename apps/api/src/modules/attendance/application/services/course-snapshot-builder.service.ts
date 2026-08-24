import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ATTENDANCE_STATUS } from '@repo/common';
import { AttendanceRecord } from '../../domain/entities/attendance-record.entity';
import { ICoursePort } from '../../domain/ports/courses.port.interface';
import { IAttendanceRecordRepository } from '../../domain/repositories/attendance-record.repository.interface';
import { CourseSnapshot } from '../../domain/value-objects/course-snapshot.vo';
import { AttendanceCalculationService } from './attendance-calculation.service';

@Injectable()
export class CourseSnapshotBuilderService {
	constructor(
		@Inject('IAttendanceRecordRepository')
		private readonly attendanceRepo: IAttendanceRecordRepository,
		@Inject('ICoursePort')
		private readonly coursePort: ICoursePort,
		private readonly attendanceService: AttendanceCalculationService,
	) {}
	public async buildCourseSnapshot(
		courseId: string,
		from: Date,
		to?: Date,
	): Promise<CourseSnapshot> {
		const course = await this.coursePort.findById(courseId);
		if (!course) throw new NotFoundException('Course not found');

		if (to?.getTime() !== from.getTime()) {
			const raw = await this.attendanceRepo.getCourseSummaryForDateRange(
				courseId,
				from,
				to,
			);
			const { justified, late, totalStudents, presents, absents } = raw;
			const expectedClasses =
				await this.attendanceService.getExpectedClassesForCourse(
					from,
					to,
					courseId,
					course.academicYearId,
				);
			return new CourseSnapshot(
				courseId,
				expectedClasses,
				course.name,
				Number.parseInt(totalStudents),
				Number.parseInt(presents),
				Number.parseInt(absents),
				Number.parseInt(late),
				Number.parseInt(justified),
			);
		}
		const { justified, late, totalStudents, presents, absents } =
			await this.attendanceRepo.getCourseSummaryForDate(courseId, from);
		const expectedClasses =
			await this.attendanceService.getExpectedClassesForCourse(
				from,
				from,
				courseId,
				course.academicYearId,
			);
		return new CourseSnapshot(
			courseId,
			expectedClasses,
			course.name,
			Number.parseInt(totalStudents),
			Number.parseInt(presents),
			Number.parseInt(absents),
			Number.parseInt(late),
			Number.parseInt(justified),
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
