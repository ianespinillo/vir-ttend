import { NotFoundException } from '@nestjs/common';
import { ATTENDANCE_STATUS, AttendanceStatus, LEVEL } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { AttendanceRecord } from '../../../src/modules/attendance/domain/entities/attendance-record.entity';
import { Course } from '../../../src/modules/attendance/domain/entities/course.entity';
import { ICoursePort } from '../../../src/modules/attendance/domain/ports/courses.port.interface';
import { IAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/attendance-record.repository.interface';
import { DashboardService } from '../../../src/modules/attendance/domain/services/dashboard.service';

const makeRecord = (status: AttendanceStatus, date: string): AttendanceRecord =>
	AttendanceRecord.reconstitute({
		id: `rec-${Math.random()}`,
		tenantId: 'tenant-1',
		studentId: `student-${Math.random()}`,
		courseId: 'course-1',
		date: new Date(`${date}T12:00:00.000Z`),
		status,
		editedBy: 'teacher-1',
		editedAt: new Date(),
		createdAt: new Date(),
	});

describe('DashboardService', () => {
	let dashboardService: DashboardService;
	let attendanceRecordRepo: MockProxy<IAttendanceRecordRepository>;
	let coursePort: MockProxy<ICoursePort>;

	beforeEach(() => {
		attendanceRecordRepo = mock<IAttendanceRecordRepository>();
		coursePort = mock<ICoursePort>();
		dashboardService = new DashboardService(attendanceRecordRepo, coursePort);
	});

	describe('buildCourseSnapshot', () => {
		const course = Course.reconstitute(
			'course-1',
			'3° B',
			'ay-1',
			true,
			LEVEL.SECONDARY,
		);

		it('lanza NotFoundException si el curso no existe', async () => {
			coursePort.findById.mockResolvedValue(null);

			await expect(
				dashboardService.buildCourseSnapshot('course-999', new Date('2026-07-01')),
			).rejects.toThrow(NotFoundException);
		});

		it('llama a getCourseSummaryForDate cuando to no se provee', async () => {
			coursePort.findById.mockResolvedValue(course);
			attendanceRecordRepo.getCourseSummaryForDate.mockResolvedValue({
				courseId: 'course-1',
				totalStudents: 25,
				presents: 20,
				absents: 3,
				late: 1,
				justified: 1,
			});

			const from = new Date('2026-07-01');
			await dashboardService.buildCourseSnapshot('course-1', from);

			expect(attendanceRecordRepo.getCourseSummaryForDate).toHaveBeenCalledWith(
				'course-1',
				from,
			);
			expect(
				attendanceRecordRepo.getCourseSummaryForDateRange,
			).not.toHaveBeenCalled();
		});

		it('llama a getCourseSummaryForDateRange cuando to es distinto de from', async () => {
			coursePort.findById.mockResolvedValue(course);
			attendanceRecordRepo.getCourseSummaryForDateRange.mockResolvedValue({
				courseId: 'course-1',
				totalStudents: 25,
				presents: 50,
				absents: 10,
				late: 3,
				justified: 2,
			});

			const from = new Date('2026-07-01');
			const to = new Date('2026-07-15');
			await dashboardService.buildCourseSnapshot('course-1', from, to);

			expect(
				attendanceRecordRepo.getCourseSummaryForDateRange,
			).toHaveBeenCalledWith('course-1', from, to);
			expect(attendanceRecordRepo.getCourseSummaryForDate).not.toHaveBeenCalled();
		});

		it('llama a getCourseSummaryForDate cuando to es igual a from', async () => {
			coursePort.findById.mockResolvedValue(course);
			attendanceRecordRepo.getCourseSummaryForDate.mockResolvedValue({
				courseId: 'course-1',
				totalStudents: 25,
				presents: 20,
				absents: 3,
				late: 1,
				justified: 1,
			});

			const date = new Date('2026-07-01');
			await dashboardService.buildCourseSnapshot('course-1', date, date);

			expect(attendanceRecordRepo.getCourseSummaryForDate).toHaveBeenCalled();
			expect(
				attendanceRecordRepo.getCourseSummaryForDateRange,
			).not.toHaveBeenCalled();
		});

		it('retorna un CourseSnapshot con los valores correctos (single date)', async () => {
			coursePort.findById.mockResolvedValue(course);
			attendanceRecordRepo.getCourseSummaryForDate.mockResolvedValue({
				courseId: 'course-1',
				totalStudents: 30,
				presents: 24,
				absents: 4,
				late: 1,
				justified: 1,
			});

			const snapshot = await dashboardService.buildCourseSnapshot(
				'course-1',
				new Date('2026-07-01'),
			);

			expect(snapshot.courseId).toBe('course-1');
			expect(snapshot.courseName).toBe('3° B');
			expect(snapshot.totalStudents).toBe(30);
			expect(snapshot.presents).toBe(24);
			expect(snapshot.absents).toBe(4);
			expect(snapshot.late).toBe(1);
			expect(snapshot.absencePercent).toBeCloseTo(16.67, 1);
			expect(snapshot.notRecorded).toBe(0);
		});

		it('retorna un CourseSnapshot con los valores correctos (date range)', async () => {
			coursePort.findById.mockResolvedValue(course);
			attendanceRecordRepo.getCourseSummaryForDateRange.mockResolvedValue({
				courseId: 'course-1',
				totalStudents: 30,
				presents: 60,
				absents: 15,
				late: 5,
				justified: 5,
			});

			const snapshot = await dashboardService.buildCourseSnapshot(
				'course-1',
				new Date('2026-07-01'),
				new Date('2026-07-15'),
			);

			expect(snapshot.totalStudents).toBe(30);
			expect(snapshot.presents).toBe(60);
			expect(snapshot.absents).toBe(15);
			expect(snapshot.late).toBe(5);
		});
	});

	describe('buildWeeklyTrend', () => {
		it('retorna array vacío si no hay records', () => {
			const trend = dashboardService.buildWeeklyTrend([]);
			expect(trend).toEqual([]);
		});

		it('agrega records por semana y calcula % de presentes', () => {
			const records = [
				makeRecord(ATTENDANCE_STATUS.PRESENT, '2026-07-06'),
				makeRecord(ATTENDANCE_STATUS.PRESENT, '2026-07-07'),
				makeRecord(ATTENDANCE_STATUS.ABSENT, '2026-07-08'),
				makeRecord(ATTENDANCE_STATUS.PRESENT, '2026-07-13'),
				makeRecord(ATTENDANCE_STATUS.ABSENT, '2026-07-14'),
				makeRecord(ATTENDANCE_STATUS.ABSENT, '2026-07-15'),
			];

			const trend = dashboardService.buildWeeklyTrend(records);

			expect(trend).toHaveLength(2);

			const week1 = trend.find((t) =>
				t.mondayWeek.toISOString().startsWith('2026-07-06'),
			);
			const week2 = trend.find((t) =>
				t.mondayWeek.toISOString().startsWith('2026-07-13'),
			);

			expect(week1).toBeDefined();
			expect(week1?.percent).toBe(75);
			expect(week2).toBeDefined();
			expect(week2?.percent).toBe(50);
		});

		it('retorna 100% si todos los records de una semana son presentes', () => {
			const records = [
				makeRecord(ATTENDANCE_STATUS.PRESENT, '2026-07-06'),
				makeRecord(ATTENDANCE_STATUS.PRESENT, '2026-07-07'),
				makeRecord(ATTENDANCE_STATUS.PRESENT, '2026-07-08'),
			];

			const trend = dashboardService.buildWeeklyTrend(records);

			expect(trend).toHaveLength(1);
			expect(trend[0].percent).toBe(100);
		});

		it('retorna 0% si ningún record de una semana es presente', () => {
			const records = [
				makeRecord(ATTENDANCE_STATUS.ABSENT, '2026-07-06'),
				makeRecord(ATTENDANCE_STATUS.LATE, '2026-07-07'),
				makeRecord(ATTENDANCE_STATUS.JUSTIFIED, '2026-07-08'),
			];

			const trend = dashboardService.buildWeeklyTrend(records);

			expect(trend).toHaveLength(1);
			expect(trend[0].percent).toBe(0);
		});

		it('maneja LATE y JUSTIFIED como no presentes en el cálculo', () => {
			const records = [
				makeRecord(ATTENDANCE_STATUS.PRESENT, '2026-07-06'),
				makeRecord(ATTENDANCE_STATUS.LATE, '2026-07-07'),
				makeRecord(ATTENDANCE_STATUS.JUSTIFIED, '2026-07-08'),
			];

			const trend = dashboardService.buildWeeklyTrend(records);

			expect(trend).toHaveLength(1);
			expect(trend[0].percent).toBe(50);
		});

		it('retorna el mondayWeek correcto para cada semana', () => {
			const records = [
				makeRecord(ATTENDANCE_STATUS.PRESENT, '2026-07-06'), // lunes
				makeRecord(ATTENDANCE_STATUS.PRESENT, '2026-07-13'), // lunes siguiente semana
			];

			const trend = dashboardService.buildWeeklyTrend(records);

			expect(trend).toHaveLength(2);
			expect(trend[0].mondayWeek.toISOString().startsWith('2026-07-06')).toBe(
				true,
			);
			expect(trend[1].mondayWeek.toISOString().startsWith('2026-07-13')).toBe(
				true,
			);
		});
	});
});
