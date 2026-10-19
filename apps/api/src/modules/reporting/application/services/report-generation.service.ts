import { Inject, Injectable } from '@nestjs/common';
import { LevelType } from '@repo/common';
import { NotFoundError } from '../../../../common/errors';
import { toDateKey } from '../../../attendance/domain/services/weighted-absence';
import { AttendanceRecord } from '../../domain/entities/attendance-record.entity';
import { IAcademicYearPort } from '../../domain/ports/academic-year.port.interface';
import { IAttendanceAlertPort } from '../../domain/ports/attendance-alert.port.interface';
import { IAttendanceRecordPort } from '../../domain/ports/attendance.port.interface';
import { ICoursePort } from '../../domain/ports/course.port.interface';
import { IStudentPort } from '../../domain/ports/student.port.interface';
import { MetricsCalculationService } from '../../domain/services/metrics-calculation.service';
import {
	IDetailedStudentReport,
	StudentMonthlyEntry,
} from '../../domain/types/detailed-student-report.type';
import { StudentReportEntry } from '../../domain/types/student-report-entry.type';
import { MonthlyReportData } from '../../domain/value-objects/monthly-report-data.vo';
import { ReportPeriod } from '../../domain/value-objects/report-period.vo';

@Injectable()
export class ReportGenerationService {
	private readonly metrics = new MetricsCalculationService();

	constructor(
		@Inject('IAttendanceRecordPort')
		private readonly attendanceRecordPort: IAttendanceRecordPort,
		@Inject('IAttendanceAlertPort')
		private readonly alertsPort: IAttendanceAlertPort,
		@Inject('IStudentPort')
		private readonly studentPort: IStudentPort,
		@Inject('IAcademicYearPort')
		private readonly academicYearPort: IAcademicYearPort,
		@Inject('ICoursePort')
		private readonly coursePort: ICoursePort,
	) {}

	async generateMonthlyReport(
		courseId: string,
		period: ReportPeriod,
	): Promise<MonthlyReportData> {
		const course = await this.coursePort.findById(courseId);
		if (!course) throw new NotFoundError('Curso no encontrado');

		// Two bulk reads for the whole course; the weighting is applied per student
		// in memory, so the queries do not grow with the number of students.
		const { from, to } = period.toDateRange();
		const [dailyRecords, workshopRecords] = await Promise.all([
			this.attendanceRecordPort.findDailyByCourseAndDateRange(courseId, from, to),
			this.attendanceRecordPort.findWorkshopByCourseAndDateRange(
				courseId,
				from,
				to,
			),
		]);

		const dailyPerStudent = this.groupByStudent(dailyRecords);
		const workshopPerStudent = this.groupByStudent(workshopRecords);
		const studentIds = new Set([
			...dailyPerStudent.keys(),
			...workshopPerStudent.keys(),
		]);

		const studentReports = await Promise.all(
			Array.from(studentIds).map((id) =>
				this.buildStudentReport(
					id,
					dailyPerStudent.get(id) ?? [],
					workshopPerStudent.get(id) ?? [],
					course.isWorkshopOnly,
				),
			),
		);

		const workingDays = await this.academicYearPort.getWorkingDaysBYAcademicYear(
			course.academicYearId,
		);

		return MonthlyReportData.fromData({
			workingDays,
			summary: this.buildCourseSummary(studentReports),
			level: course.level,
			courseName: course.name,
			period: { month: period.month, year: period.year },
			students: studentReports,
		});
	}

	async generateDetailedStudentReport(
		studentId: string,
		academicYearId: string,
	): Promise<IDetailedStudentReport> {
		const year = await this.academicYearPort.findById(academicYearId);
		if (!year) throw new NotFoundError('Ciclo lectivo no encontrado');

		const [dailyRecords, workshopRecords] = await Promise.all([
			this.attendanceRecordPort.findDailyByStudentAndDateRange(
				studentId,
				year.startDate,
				year.endDate,
			),
			this.attendanceRecordPort.findWorkshopByStudentAndDateRange(
				studentId,
				year.startDate,
				year.endDate,
			),
		]);

		const courseId = (dailyRecords[0] ?? workshopRecords[0])?.courseId;
		const course = courseId ? await this.coursePort.findById(courseId) : null;
		const workshopOnly = course?.isWorkshopOnly ?? false;

		const basic = await this.buildStudentReport(
			studentId,
			dailyRecords,
			workshopRecords,
			workshopOnly,
		);

		const months = this.buildMonthlyBreakdown(
			dailyRecords,
			workshopRecords,
			workshopOnly,
		);
		const totals = this.aggregateMonthlyTotals(months);

		return {
			studentId: basic.studentId,
			fullName: basic.fullName,
			documentNumber: basic.documentNumber,
			courseId: course?.id ?? '',
			courseName: course?.name ?? '',
			level: course?.level ?? ('primary' as LevelType),
			academicYearId: course?.academicYearId ?? '',
			months,
			totals,
			status: this.metrics.getStatus(totals.averageAbsencePercent),
			alerts: basic.alerts,
		};
	}

	// ---------- helpers privados ----------

	private async buildStudentReport(
		id: string,
		dailyRecords: AttendanceRecord[],
		workshopRecords: AttendanceRecord[],
		workshopOnly: boolean,
	): Promise<StudentReportEntry> {
		const student = await this.studentPort.findStudent(id);
		if (!student) throw new NotFoundError('Estudiante no encontrado');

		const alerts = await this.alertsPort.findByStudentId(id);
		const metrics = this.metrics.calculateStudentMetrics(
			dailyRecords,
			workshopRecords,
			{ workshopOnly },
		);

		return {
			studentId: id,
			fullName: student.name,
			documentNumber: student.documentNumber,
			alerts: alerts.map((alert) => ({ status: alert.alertType.status })),
			present: metrics.present,
			absent: metrics.absent,
			late: metrics.late,
			justified: metrics.justified,
			daysGiven: metrics.daysGiven,
			absenceBreakdown: metrics.absenceBreakdown,
			absencePercent: metrics.absencePercent,
			status: metrics.status,
		};
	}

	private groupByStudent(
		records: AttendanceRecord[],
	): Map<string, AttendanceRecord[]> {
		const map = new Map<string, AttendanceRecord[]>();
		for (const record of records) {
			const existing = map.get(record.studentId);
			if (existing) existing.push(record);
			else map.set(record.studentId, [record]);
		}
		return map;
	}

	/** Month key (`YYYY-MM`) of the stored calendar day, read like the weighting does. */
	private monthKeyOf(record: AttendanceRecord): string {
		return toDateKey(record.date).slice(0, 7);
	}

	private buildMonthlyBreakdown(
		dailyRecords: AttendanceRecord[],
		workshopRecords: AttendanceRecord[],
		workshopOnly: boolean,
	): StudentMonthlyEntry[] {
		const keys = new Set(
			[...dailyRecords, ...workshopRecords].map((r) => this.monthKeyOf(r)),
		);

		return Array.from(keys)
			.sort()
			.map((key) => {
				const [yearStr, monthStr] = key.split('-');
				const metrics = this.metrics.calculateStudentMetrics(
					dailyRecords.filter((r) => this.monthKeyOf(r) === key),
					workshopRecords.filter((r) => this.monthKeyOf(r) === key),
					{ workshopOnly },
				);

				return {
					month: Number(monthStr),
					year: Number(yearStr),
					present: metrics.present,
					absent: metrics.absent,
					late: metrics.late,
					justified: metrics.justified,
					daysGiven: metrics.daysGiven,
					absenceBreakdown: metrics.absenceBreakdown,
					absencePercent: metrics.absencePercent,
					status: metrics.status,
				};
			});
	}

	private aggregateMonthlyTotals(
		months: StudentMonthlyEntry[],
	): IDetailedStudentReport['totals'] {
		const totals = months.reduce(
			(acc, m) => {
				acc.present += m.present;
				acc.absent += m.absent;
				acc.late += m.late;
				acc.justified += m.justified;
				acc.totalDays += m.daysGiven;
				acc.absenceBreakdown.daily += m.absenceBreakdown.daily;
				acc.absenceBreakdown.workshop += m.absenceBreakdown.workshop;
				return acc;
			},
			{
				present: 0,
				absent: 0,
				late: 0,
				justified: 0,
				totalDays: 0,
				absenceBreakdown: { daily: 0, workshop: 0 },
			},
		);

		return {
			...totals,
			averageAbsencePercent:
				totals.totalDays > 0 ? (totals.absent / totals.totalDays) * 100 : null,
		};
	}

	/**
	 * Course attendance over the days given to each student:
	 * (days given - weighted absences) / days given. Null when no class was given.
	 */
	private buildCourseSummary(studentReports: StudentReportEntry[]): {
		studentsAtRisk: number;
		studentsExceeded: number;
		averageAttendance: number | null;
	} {
		const daysGiven = studentReports.reduce(
			(sum, r) => sum + (r.daysGiven ?? 0),
			0,
		);
		const absences = studentReports.reduce((sum, r) => sum + r.absent, 0);

		return {
			studentsAtRisk: studentReports.filter((r) => r.status === 'at-risk').length,
			studentsExceeded: studentReports.filter((r) => r.status === 'exceeded')
				.length,
			averageAttendance:
				daysGiven > 0 ? ((daysGiven - absences) / daysGiven) * 100 : null,
		};
	}
}
