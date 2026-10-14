import type { AttendanceStatus } from '@repo/common';
import { ATTENDANCE_STATUS, LEVEL } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { ReportGenerationService } from '../../../src/modules/reporting/application/services/report-generation.service';
import { AcademicYear } from '../../../src/modules/reporting/domain/entities/academic-year.entity';
import { AttendanceRecord } from '../../../src/modules/reporting/domain/entities/attendance-record.entity';
import { Course } from '../../../src/modules/reporting/domain/entities/course.entity';
import { Student } from '../../../src/modules/reporting/domain/entities/student.entity';
import { IAcademicYearPort } from '../../../src/modules/reporting/domain/ports/academic-year.port.interface';
import { IAttendanceAlertPort } from '../../../src/modules/reporting/domain/ports/attendance-alert.port.interface';
import { IAttendanceRecordPort } from '../../../src/modules/reporting/domain/ports/attendance.port.interface';
import { ICoursePort } from '../../../src/modules/reporting/domain/ports/course.port.interface';
import { IStudentPort } from '../../../src/modules/reporting/domain/ports/student.port.interface';
import { ReportPeriod } from '../../../src/modules/reporting/domain/value-objects/report-period.vo';

// Stored dates are calendar days at UTC midnight. Month 7 of the current year
// (the report period only accepts the current year).
const YEAR = new Date().getFullYear();
const utc = (month: number, day: number) =>
	new Date(
		`${YEAR}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`,
	);

const makeRecord = (
	status: AttendanceStatus,
	studentId: string,
	date: Date,
): AttendanceRecord =>
	AttendanceRecord.reconstitute({
		id: `rec-${Math.random().toString(36).slice(2)}`,
		studentId,
		courseId: 'course-1',
		date,
		status,
	});

const jul1 = utc(7, 1);
const jul2 = utc(7, 2);
const jul3 = utc(7, 3);
const jul6 = utc(7, 6);

const student = Student.reconstitute({
	id: 'student-1',
	name: 'Juan Pérez',
	documentNumber: 'DNI123',
});
const student2 = Student.reconstitute({
	id: 'student-2',
	name: 'María Gómez',
	documentNumber: 'DNI456',
});

const course = Course.reconstitute({
	id: 'course-1',
	name: '3° A',
	level: LEVEL.PRIMARY,
	academicYearId: 'ay-1',
	tenantId: 'tenant-1',
});

describe('ReportGenerationService', () => {
	let service: ReportGenerationService;
	let studentPort: MockProxy<IStudentPort>;
	let coursePort: MockProxy<ICoursePort>;
	let academicYearPort: MockProxy<IAcademicYearPort>;
	let attendanceRecordPort: MockProxy<IAttendanceRecordPort>;
	let alertsPort: MockProxy<IAttendanceAlertPort>;

	beforeEach(() => {
		studentPort = mock<IStudentPort>();
		coursePort = mock<ICoursePort>();
		academicYearPort = mock<IAcademicYearPort>();
		attendanceRecordPort = mock<IAttendanceRecordPort>();
		alertsPort = mock<IAttendanceAlertPort>();

		studentPort.findStudent.mockImplementation(async (id: string) =>
			id === 'student-2' ? student2 : student,
		);
		alertsPort.findByStudentId.mockResolvedValue([]);
		attendanceRecordPort.findDailyByCourseAndDateRange.mockResolvedValue([]);
		attendanceRecordPort.findWorkshopByCourseAndDateRange.mockResolvedValue([]);
		attendanceRecordPort.findDailyByStudentAndDateRange.mockResolvedValue([]);
		attendanceRecordPort.findWorkshopByStudentAndDateRange.mockResolvedValue([]);

		service = new ReportGenerationService(
			attendanceRecordPort,
			alertsPort,
			studentPort,
			academicYearPort,
			coursePort,
		);
	});

	describe('generateMonthlyReport', () => {
		const period = ReportPeriod.generate(7, YEAR);

		beforeEach(() => {
			coursePort.findById.mockResolvedValue(course);
			academicYearPort.getWorkingDaysBYAcademicYear.mockResolvedValue(22);
		});

		const entryOf = async (id: string) => {
			const result = await service.generateMonthlyReport('course-1', period);
			const entry = result.students.find((s) => s.studentId === id);
			if (!entry) throw new Error(`no entry for ${id}`);
			return entry;
		};

		it('lanza NotFoundException si el curso no existe', async () => {
			coursePort.findById.mockResolvedValue(null);
			await expect(
				service.generateMonthlyReport('invalid', period),
			).rejects.toThrow('Course not found');
		});

		it('builds the header and the summary over the days given', async () => {
			attendanceRecordPort.findDailyByCourseAndDateRange.mockResolvedValue([
				makeRecord(ATTENDANCE_STATUS.PRESENT, 'student-1', jul1),
				makeRecord(ATTENDANCE_STATUS.PRESENT, 'student-2', jul1),
				makeRecord(ATTENDANCE_STATUS.ABSENT, 'student-2', jul2),
			]);

			const result = await service.generateMonthlyReport('course-1', period);

			expect(result.courseName).toBe('3° A');
			expect(result.level).toBe(LEVEL.PRIMARY);
			expect(result.workingDays).toBe(22);
			expect(result.period).toEqual({ month: 7, year: YEAR });
			expect(result.students).toHaveLength(2);
			// 3 student-days given, 1 weighted absence.
			expect(result.summary.averageAttendance).toBeCloseTo((2 / 3) * 100, 5);
		});

		it('queries the whole course once, daily and workshop apart, with the period dates', async () => {
			await service.generateMonthlyReport('course-1', period);

			const { from, to } = period.toDateRange();
			expect(
				attendanceRecordPort.findDailyByCourseAndDateRange,
			).toHaveBeenCalledTimes(1);
			expect(
				attendanceRecordPort.findDailyByCourseAndDateRange,
			).toHaveBeenCalledWith('course-1', from, to);
			expect(
				attendanceRecordPort.findWorkshopByCourseAndDateRange,
			).toHaveBeenCalledTimes(1);
			expect(
				attendanceRecordPort.findWorkshopByCourseAndDateRange,
			).toHaveBeenCalledWith('course-1', from, to);
			expect(
				attendanceRecordPort.findDailyByStudentAndDateRange,
			).not.toHaveBeenCalled();
		});

		it('weighs a workshop day 0.5 + 0.5 = 1 and exposes the breakdown', async () => {
			attendanceRecordPort.findDailyByCourseAndDateRange.mockResolvedValue([
				makeRecord(ATTENDANCE_STATUS.ABSENT, 'student-1', jul1),
			]);
			attendanceRecordPort.findWorkshopByCourseAndDateRange.mockResolvedValue([
				makeRecord(ATTENDANCE_STATUS.ABSENT, 'student-1', jul1),
			]);

			const entry = await entryOf('student-1');

			expect(entry.absent).toBe(1);
			expect(entry.absenceBreakdown).toEqual({ daily: 0.5, workshop: 0.5 });
			expect(entry.daysGiven).toBe(1);
		});

		it('weighs a daily absence 1 on a day without a workshop record', async () => {
			attendanceRecordPort.findDailyByCourseAndDateRange.mockResolvedValue([
				makeRecord(ATTENDANCE_STATUS.ABSENT, 'student-1', jul1),
			]);

			const entry = await entryOf('student-1');

			expect(entry.absent).toBe(1);
			expect(entry.absenceBreakdown).toEqual({ daily: 1, workshop: 0 });
		});

		it('weighs a late 0.25 and a late beyond the tolerance 0.5', async () => {
			attendanceRecordPort.findDailyByCourseAndDateRange.mockResolvedValue([
				makeRecord(ATTENDANCE_STATUS.LATE, 'student-1', jul1),
				makeRecord(ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE, 'student-1', jul2),
				makeRecord(ATTENDANCE_STATUS.LATE, 'student-1', jul3),
			]);

			const entry = await entryOf('student-1');

			expect(entry.absent).toBe(1);
			expect(entry.late).toBe(3);
			expect(entry.daysGiven).toBe(3);
		});

		it('counts justified absences as absences', async () => {
			attendanceRecordPort.findDailyByCourseAndDateRange.mockResolvedValue([
				makeRecord(ATTENDANCE_STATUS.JUSTIFIED, 'student-1', jul1),
			]);

			const entry = await entryOf('student-1');

			expect(entry.absent).toBe(1);
			expect(entry.justified).toBe(1);
		});

		it('caps a day at 1 when the daily and workshop parts add up to more', async () => {
			attendanceRecordPort.findDailyByCourseAndDateRange.mockResolvedValue([
				makeRecord(ATTENDANCE_STATUS.LATE_BEYOND_TOLERANCE, 'student-1', jul1),
			]);
			attendanceRecordPort.findWorkshopByCourseAndDateRange.mockResolvedValue([
				makeRecord(ATTENDANCE_STATUS.ABSENT, 'student-1', jul1),
				makeRecord(ATTENDANCE_STATUS.ABSENT, 'student-1', jul1),
			]);

			const entry = await entryOf('student-1');

			expect(entry.absent).toBe(1);
		});

		it('computes the percentage over the days given, not the schedule', async () => {
			attendanceRecordPort.findDailyByCourseAndDateRange.mockResolvedValue([
				makeRecord(ATTENDANCE_STATUS.ABSENT, 'student-1', jul1),
				makeRecord(ATTENDANCE_STATUS.PRESENT, 'student-1', jul2),
				makeRecord(ATTENDANCE_STATUS.PRESENT, 'student-1', jul3),
				makeRecord(ATTENDANCE_STATUS.LATE, 'student-1', jul6),
			]);

			const entry = await entryOf('student-1');

			// 1.25 weighted absences over 4 days given, unrounded.
			expect(entry.absencePercent).toBeCloseTo(31.25, 10);
		});

		it('counts a day with both a daily and a workshop record once in the days given', async () => {
			attendanceRecordPort.findDailyByCourseAndDateRange.mockResolvedValue([
				makeRecord(ATTENDANCE_STATUS.PRESENT, 'student-1', jul1),
				makeRecord(ATTENDANCE_STATUS.PRESENT, 'student-1', jul2),
			]);
			attendanceRecordPort.findWorkshopByCourseAndDateRange.mockResolvedValue([
				makeRecord(ATTENDANCE_STATUS.PRESENT, 'student-1', jul1),
			]);

			const entry = await entryOf('student-1');

			expect(entry.daysGiven).toBe(2);
			expect(entry.absencePercent).toBe(0);
		});

		it('has no percentage and no average when no class was given', async () => {
			const result = await service.generateMonthlyReport('course-1', period);

			expect(result.students).toEqual([]);
			expect(result.summary.averageAttendance).toBeNull();
		});

		it('includes a student that only has workshop records', async () => {
			attendanceRecordPort.findWorkshopByCourseAndDateRange.mockResolvedValue([
				makeRecord(ATTENDANCE_STATUS.ABSENT, 'student-2', jul1),
			]);

			const entry = await entryOf('student-2');

			expect(entry.absent).toBe(0.5);
			expect(entry.absenceBreakdown).toEqual({ daily: 0, workshop: 0.5 });
		});

		it('flags students by the weighted percentage', async () => {
			attendanceRecordPort.findDailyByCourseAndDateRange.mockResolvedValue([
				makeRecord(ATTENDANCE_STATUS.ABSENT, 'student-1', jul1),
				makeRecord(ATTENDANCE_STATUS.ABSENT, 'student-1', jul2),
				makeRecord(ATTENDANCE_STATUS.ABSENT, 'student-1', jul3),
				makeRecord(ATTENDANCE_STATUS.PRESENT, 'student-1', jul6),
				makeRecord(ATTENDANCE_STATUS.PRESENT, 'student-2', jul1),
			]);

			const result = await service.generateMonthlyReport('course-1', period);

			expect(result.summary.studentsAtRisk).toBe(1);
			expect(result.summary.studentsExceeded).toBe(0);
			expect(result.students.map((s) => s.status).sort()).toEqual([
				'at-risk',
				'ok',
			]);
		});
	});

	describe('generateDetailedStudentReport', () => {
		const aug1 = new Date(`${YEAR}-08-01T00:00:00.000Z`);

		beforeEach(() => {
			academicYearPort.findById.mockResolvedValue(
				AcademicYear.reconstitute({
					id: 'ay-1',
					tenantId: 'tenant-1',
					year: YEAR,
					startDate: new Date(`${YEAR}-03-01T00:00:00.000Z`),
					endDate: new Date(`${YEAR}-12-18T00:00:00.000Z`),
				}),
			);
			coursePort.findById.mockResolvedValue(course);
		});

		it('breaks the weighted totals down by month and sums them', async () => {
			attendanceRecordPort.findDailyByStudentAndDateRange.mockResolvedValue([
				makeRecord(ATTENDANCE_STATUS.ABSENT, 'student-1', jul1),
				makeRecord(ATTENDANCE_STATUS.PRESENT, 'student-1', jul2),
				makeRecord(ATTENDANCE_STATUS.LATE, 'student-1', aug1),
			]);
			attendanceRecordPort.findWorkshopByStudentAndDateRange.mockResolvedValue([
				makeRecord(ATTENDANCE_STATUS.ABSENT, 'student-1', jul1),
			]);

			const report = await service.generateDetailedStudentReport(
				'student-1',
				'ay-1',
			);

			expect(report.months).toHaveLength(2);
			expect(report.months[0]).toMatchObject({
				month: 7,
				year: YEAR,
				absent: 1,
				daysGiven: 2,
				absenceBreakdown: { daily: 0.5, workshop: 0.5 },
				absencePercent: 50,
			});
			expect(report.months[1]).toMatchObject({
				month: 8,
				absent: 0.25,
				daysGiven: 1,
				absencePercent: 25,
			});
			expect(report.totals).toMatchObject({
				absent: 1.25,
				totalDays: 3,
				present: 1,
				late: 1,
				absenceBreakdown: { daily: 0.75, workshop: 0.5 },
			});
			expect(report.totals.averageAbsencePercent).toBeCloseTo(
				(1.25 / 3) * 100,
				10,
			);
			expect(report.courseName).toBe('3° A');
		});

		it('groups by the stored calendar day, so the 1st of a month stays in its month', async () => {
			attendanceRecordPort.findDailyByStudentAndDateRange.mockResolvedValue([
				makeRecord(ATTENDANCE_STATUS.ABSENT, 'student-1', aug1),
			]);

			const report = await service.generateDetailedStudentReport(
				'student-1',
				'ay-1',
			);

			expect(report.months.map((m) => m.month)).toEqual([8]);
		});

		it('reads daily and workshop records of the whole year apart', async () => {
			await service.generateDetailedStudentReport('student-1', 'ay-1');

			expect(
				attendanceRecordPort.findDailyByStudentAndDateRange,
			).toHaveBeenCalledWith(
				'student-1',
				new Date(`${YEAR}-03-01T00:00:00.000Z`),
				new Date(`${YEAR}-12-18T00:00:00.000Z`),
			);
			expect(
				attendanceRecordPort.findWorkshopByStudentAndDateRange,
			).toHaveBeenCalledTimes(1);
		});

		it('has no percentage when no class was given', async () => {
			const report = await service.generateDetailedStudentReport(
				'student-1',
				'ay-1',
			);

			expect(report.months).toEqual([]);
			expect(report.totals.totalDays).toBe(0);
			expect(report.totals.averageAbsencePercent).toBeNull();
			expect(report.status).toBe('ok');
		});
	});
});
