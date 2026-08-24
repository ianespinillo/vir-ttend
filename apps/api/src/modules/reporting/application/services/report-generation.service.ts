import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
	ATTENDANCE_STATUS,
	ATTENDANCE_THRESHOLDS,
	LevelType,
} from '@repo/common';
import { AttendanceRecord } from '../../domain/entities/attendance-record.entity';
import { IAcademicYearPort } from '../../domain/ports/academic-year.port.interface';
import { IAttendanceAlertPort } from '../../domain/ports/attendance-alert.port.interface';
import { IAttendanceRecordPort } from '../../domain/ports/attendance.port.interface';
import { ICoursePort } from '../../domain/ports/course.port.interface';
import { IStudentPort } from '../../domain/ports/student.port.interface';
import {
	IDetailedStudentReport,
	StudentMonthlyEntry,
} from '../../domain/types/detailed-student-report.type';
import {
	ReportStudentStatus,
	StudentReportEntry,
} from '../../domain/types/student-report-entry.type';
import { MonthlyReportData } from '../../domain/value-objects/monthly-report-data.vo';
import { ReportPeriod } from '../../domain/value-objects/report-period.vo';

@Injectable()
export class ReportGenerationService {
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
		if (!course) throw new NotFoundException('Course not found');

		const { from, to } = period.toDateRange();
		const records = await this.attendanceRecordPort.findByCourseAndDateRange(
			courseId,
			from,
			to,
		);

		const recordsPerStudent = this.groupByStudent(records);

		const studentReports = await Promise.all(
			Array.from(recordsPerStudent.entries()).map(([id, studentRecords]) =>
				this.buildStudentReport(id, studentRecords),
			),
		);

		const workingDays = await this.academicYearPort.getWorkingDaysBYAcademicYear(
			course.academicYearId,
		);

		return MonthlyReportData.fromData({
			workingDays,
			summary: this.buildCourseSummary(records, studentReports),
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
		if (!year) throw new Error('Academic Year not found');

		const records = await this.attendanceRecordPort.findByStudentAndDateRange(
			studentId,
			year.startDate,
			year.endDate,
		);

		const basic = await this.buildStudentReport(studentId, records);

		const courseId = records[0]?.courseId;
		const course = courseId ? await this.coursePort.findById(courseId) : null;

		const months = this.buildMonthlyBreakdown(records);
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
			status: this.getReportStatus(totals.averageAbsencePercent),
			alerts: basic.alerts,
		};
	}

	// ---------- helpers privados ----------

	private async buildStudentReport(
		id: string,
		records: AttendanceRecord[],
	): Promise<StudentReportEntry> {
		const student = await this.studentPort.findStudent(id);
		if (!student) throw new Error('Student not found');

		const alerts = await this.alertsPort.findByStudentId(id);
		const counts = this.countByStatus(records);
		const absencePercent = this.calculateAbsencePercent(
			records.length,
			counts.present,
		);

		return {
			studentId: id,
			fullName: student.name,
			documentNumber: student.documentNumber,
			alerts: alerts.map((alert) => ({ status: alert.alertType.status })),
			present: counts.present,
			absent: counts.absent,
			late: counts.late,
			justified: counts.justified,
			absencePercent,
			status: this.getReportStatus(absencePercent),
		} as StudentReportEntry;
	}

	private countByStatus(records: AttendanceRecord[]): {
		present: number;
		absent: number;
		late: number;
		justified: number;
	} {
		return records.reduce(
			(acc, r) => {
				if (r.status === ATTENDANCE_STATUS.PRESENT) acc.present++;
				else if (r.status === ATTENDANCE_STATUS.ABSENT) acc.absent++;
				else if (r.status === ATTENDANCE_STATUS.LATE) acc.late++;
				else if (r.status === ATTENDANCE_STATUS.JUSTIFIED) acc.justified++;
				return acc;
			},
			{ present: 0, absent: 0, late: 0, justified: 0 },
		);
	}

	private calculateAbsencePercent(total: number, present: number): number {
		if (total === 0) return 0;
		return ((total - present) / total) * 100;
	}

	private getReportStatus(absencePercent: number): ReportStudentStatus {
		if (absencePercent >= ATTENDANCE_THRESHOLDS.CRITICAL) return 'exceeded';
		if (absencePercent >= ATTENDANCE_THRESHOLDS.WARNING) return 'at-risk';
		return 'ok';
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

	private groupByMonth(
		records: AttendanceRecord[],
	): Map<string, AttendanceRecord[]> {
		const map = new Map<string, AttendanceRecord[]>();
		for (const record of records) {
			const key = `${record.date.getFullYear()}-${(record.date.getMonth() + 1).toString().padStart(2, '0')}`;
			const existing = map.get(key);
			if (existing) existing.push(record);
			else map.set(key, [record]);
		}
		return map;
	}

	private buildMonthlyBreakdown(
		records: AttendanceRecord[],
	): StudentMonthlyEntry[] {
		const monthlyMap = this.groupByMonth(records);

		return Array.from(monthlyMap.entries()).map(([key, monthRecords]) => {
			const [yearStr, monthStr] = key.split('-');
			const counts = this.countByStatus(monthRecords);
			const absencePercent = this.calculateAbsencePercent(
				monthRecords.length,
				counts.present,
			);

			return {
				month: Number(monthStr),
				year: Number(yearStr),
				present: counts.present,
				absent: counts.absent,
				late: counts.late,
				justified: counts.justified,
				absencePercent,
				status: this.getReportStatus(absencePercent),
			};
		});
	}

	private aggregateMonthlyTotals(months: StudentMonthlyEntry[]): {
		present: number;
		absent: number;
		late: number;
		justified: number;
		totalDays: number;
		averageAbsencePercent: number;
	} {
		const totals = months.reduce(
			(acc, m) => {
				acc.present += m.present;
				acc.absent += m.absent;
				acc.late += m.late;
				acc.justified += m.justified;
				return acc;
			},
			{ present: 0, absent: 0, late: 0, justified: 0 },
		);

		const totalDays =
			totals.present + totals.absent + totals.late + totals.justified;
		const averageAbsencePercent = this.calculateAbsencePercent(
			totalDays,
			totals.present,
		);

		return { ...totals, totalDays, averageAbsencePercent };
	}

	private buildCourseSummary(
		records: AttendanceRecord[],
		studentReports: StudentReportEntry[],
	): {
		studentsAtRisk: number;
		studentsExceeded: number;
		averageAttendance: number;
	} {
		const present = records.filter(
			(r) => r.status === ATTENDANCE_STATUS.PRESENT,
		).length;

		return {
			studentsAtRisk: studentReports.filter((r) => r.status === 'at-risk').length,
			studentsExceeded: studentReports.filter((r) => r.status === 'exceeded')
				.length,
			averageAttendance: records.length > 0 ? (present / records.length) * 100 : 0,
		};
	}
}
