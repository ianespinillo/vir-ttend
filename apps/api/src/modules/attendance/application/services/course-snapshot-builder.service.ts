import { Inject, Injectable } from '@nestjs/common';
import { ATTENDANCE_STATUS } from '@repo/common';
import { NotFoundError } from '../../../../common/errors';
import { AttendanceRecord } from '../../domain/entities/attendance-record.entity';
import { ICoursePort } from '../../domain/ports/courses.port.interface';
import { IAttendanceRecordRepository } from '../../domain/repositories/attendance-record.repository.interface';
import { IWorkshopAttendanceRecordRepository } from '../../domain/repositories/workshop-attendance-record.repository.interface';
import { calculateWeightedAbsencesByStudent } from '../../domain/services/weighted-absence';
import { CourseSnapshot } from '../../domain/value-objects/course-snapshot.vo';
import { AttendanceCalculationService } from './attendance-calculation.service';

@Injectable()
export class CourseSnapshotBuilderService {
	constructor(
		@Inject('IAttendanceRecordRepository')
		private readonly attendanceRepo: IAttendanceRecordRepository,
		@Inject('IWorkshopAttendanceRecordRepository')
		private readonly workshopRepo: IWorkshopAttendanceRecordRepository,
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
		if (!course) throw new NotFoundError('Curso no encontrado');

		const isRange = to !== undefined && to.getTime() !== from.getTime();
		const end = isRange ? to : from;
		// Raw status counts stay integers (parsed from the SQL aggregate); the
		// absence total is weighted and may be fractional, so it is computed apart.
		const raw = isRange
			? await this.attendanceRepo.getCourseSummaryForDateRange(courseId, from, to)
			: await this.attendanceRepo.getCourseSummaryForDate(courseId, from);
		const { justified, late, totalStudents, presents, absents } = raw;
		const [expectedClasses, weighted] = await Promise.all([
			this.attendanceService.getExpectedClassesForCourse(
				from,
				end,
				courseId,
				course.academicYearId,
				course.shift,
			),
			this.weightedTotals(courseId, from, end, course.isWorkshopOnly),
		]);
		return new CourseSnapshot(
			courseId,
			expectedClasses,
			course.name,
			Number.parseInt(totalStudents),
			Number.parseInt(presents),
			Number.parseInt(absents),
			Number.parseInt(late),
			Number.parseInt(justified),
			weighted,
			course.isWorkshopOnly,
		);
	}

	/**
	 * Weighted, held-based absence total of the course and the student-days it is
	 * measured over, from two bulk reads and the pure weighting per student.
	 * `workshopOnly` marks a 7th-year technical course (no contraturno halving).
	 */
	private async weightedTotals(
		courseId: string,
		from: Date,
		to: Date,
		workshopOnly: boolean,
	): Promise<{ absences: number; studentDays: number }> {
		const [dailyRecords, workshopRecords] = await Promise.all([
			this.attendanceRepo.findDailyByCourseAndDateRange(courseId, from, to),
			this.workshopRepo.findByCourseAndDateRange(courseId, from, to),
		]);
		let absences = 0;
		let studentDays = 0;
		for (const student of calculateWeightedAbsencesByStudent(
			dailyRecords,
			workshopRecords,
			{ workshopOnly },
		).values()) {
			absences += student.total;
			studentDays += student.daysGiven;
		}
		return { absences, studentDays };
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
