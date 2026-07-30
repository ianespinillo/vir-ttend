import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ATTENDANCE_STATUS, LevelType } from '@repo/common';
import { AttendanceRecord } from '../../domain/entities/attendance-record.entity';
import { MonthlyReport } from '../../domain/entities/monthly-report.entity';
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
		const records = await this.attendanceRecordPort.findByCourseAndDateRange(
			courseId,
			period.toDateRange().from,
			period.toDateRange().to,
		);
		const recordsPerStudent = new Map<string, AttendanceRecord[]>();
		for (const record of records) {
			const existing = recordsPerStudent.get(record.studentId);
			if (existing) existing.push(record);
			else recordsPerStudent.set(record.studentId, [record]);
		}
		const studentReports = new Map<string, StudentReportEntry>();
		for (const [id, reports] of recordsPerStudent.entries()) {
			const report = await this.generateStudentReport(id, reports);
			studentReports.set(id, report);
		}
		const workingDays = await this.academicYearPort.getWorkingDaysBYAcademicYear(
			course.academicYearId,
		);
		return MonthlyReportData.fromData({
			workingDays: workingDays,
			summary: {
				studentsAtRisk: Array.from(studentReports.values()).filter(
					(report) => report.status === 'at-risk',
				).length,
				averageAttendance:
					records.filter((r) => r.status === ATTENDANCE_STATUS.PRESENT).length /
					records.length,
				studentsExceeded: Array.from(studentReports.values()).filter(
					(report) => report.status === 'exceeded',
				).length,
			},
			level: course.level,
			courseName: course.name,
			period: { month: period.month, year: period.year },
			students: Array.from(studentReports.values()),
		});
	}
	public async generateStudentReport(
		id: string,
		reports: AttendanceRecord[],
	): Promise<StudentReportEntry> {
		const student = await this.studentPort.findStudent(id);
		if (!student) throw new Error('Student not found');
		const alerts = await this.alertsPort.findByStudentId(id);
		const report = {
			studentId: id,
			fullName: student.name,
			documentNumber: student.documentNumber,
			alerts: alerts.map((alert) => ({ status: alert.alertType.status })),
			late: reports.filter((r) => r.status === ATTENDANCE_STATUS.LATE).length,
			absent: reports.filter((r) => r.status === ATTENDANCE_STATUS.ABSENT).length,
			present: reports.filter((r) => r.status === ATTENDANCE_STATUS.PRESENT)
				.length,
			justified: reports.filter((r) => r.status === ATTENDANCE_STATUS.JUSTIFIED)
				.length,
		} as StudentReportEntry;
		const total = reports.length;
		report.absencePercent =
			total > 0 ? ((total - report.present) / total) * 100 : 0;
		if (report.absencePercent >= 75) report.status = 'exceeded';
		else if (report.absencePercent >= 50) report.status = 'at-risk';
		else report.status = 'ok';
		return report;
	}

	async generateDetailedStudentReport(
		studentId: string,
		records: AttendanceRecord[],
	): Promise<IDetailedStudentReport> {
		const basic = await this.generateStudentReport(studentId, records);

		const courseId = records[0]?.courseId;
		const course = courseId ? await this.coursePort.findById(courseId) : null;

		const monthlyMap = new Map<string, AttendanceRecord[]>();
		for (const record of records) {
			const key = `${record.date.getFullYear()}-${(record.date.getMonth() + 1).toString().padStart(2, '0')}`;
			const group = monthlyMap.get(key);
			if (group) group.push(record);
			else monthlyMap.set(key, [record]);
		}

		const months: StudentMonthlyEntry[] = [];
		let totalPresent = 0;
		let totalAbsent = 0;
		let totalLate = 0;
		let totalJustified = 0;

		for (const [key, monthRecords] of monthlyMap) {
			const [yearStr, monthStr] = key.split('-');
			const year = Number(yearStr);
			const month = Number(monthStr);
			const total = monthRecords.length;
			const present = monthRecords.filter(
				(r) => r.status === ATTENDANCE_STATUS.PRESENT,
			).length;
			const absent = monthRecords.filter(
				(r) => r.status === ATTENDANCE_STATUS.ABSENT,
			).length;
			const late = monthRecords.filter(
				(r) => r.status === ATTENDANCE_STATUS.LATE,
			).length;
			const justified = monthRecords.filter(
				(r) => r.status === ATTENDANCE_STATUS.JUSTIFIED,
			).length;
			const absencePercent = total > 0 ? ((total - present) / total) * 100 : 0;

			let status: ReportStudentStatus;
			if (absencePercent >= 75) status = 'exceeded';
			else if (absencePercent >= 50) status = 'at-risk';
			else status = 'ok';

			months.push({
				month,
				year,
				present,
				absent,
				late,
				justified,
				absencePercent,
				status,
			});

			totalPresent += present;
			totalAbsent += absent;
			totalLate += late;
			totalJustified += justified;
		}

		const totalDays = totalPresent + totalAbsent + totalLate + totalJustified;
		const averageAbsencePercent =
			totalDays > 0 ? ((totalDays - totalPresent) / totalDays) * 100 : 0;

		let overallStatus: ReportStudentStatus;
		if (averageAbsencePercent >= 75) overallStatus = 'exceeded';
		else if (averageAbsencePercent >= 50) overallStatus = 'at-risk';
		else overallStatus = 'ok';

		return {
			studentId: basic.studentId,
			fullName: basic.fullName,
			documentNumber: basic.documentNumber,
			courseId: course?.id ?? '',
			courseName: course?.name ?? '',
			level: course?.level ?? ('primary' as LevelType),
			academicYearId: course?.academicYearId ?? '',
			months,
			totals: {
				present: totalPresent,
				absent: totalAbsent,
				late: totalLate,
				justified: totalJustified,
				totalDays,
				averageAbsencePercent,
			},
			status: overallStatus,
			alerts: basic.alerts,
		};
	}
}
