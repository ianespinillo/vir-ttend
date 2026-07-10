import {
	ATTENDANCE_STATUS,
	AttendanceStatus,
	COURSE_RISK_STATUS,
	LEVEL,
} from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { GetDashboardMetricsQueryHandler } from '../../../src/modules/attendance/application/queries/get-dashboard-metrics/get-dashboard-metrics.handler';
import { GetDashboardMetricsQuery } from '../../../src/modules/attendance/application/queries/get-dashboard-metrics/get-dashboard-metrics.query';
import { AcademicYear } from '../../../src/modules/attendance/domain/entities/academic-year.entity';
import { AttendanceRecord } from '../../../src/modules/attendance/domain/entities/attendance-record.entity';
import { Course } from '../../../src/modules/attendance/domain/entities/course.entity';
import { IAcademicYearPort } from '../../../src/modules/attendance/domain/ports/academic-year.port.interface';
import { ICoursePort } from '../../../src/modules/attendance/domain/ports/courses.port.interface';
import { IAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/attendance-record.repository.interface';
import { DashboardService } from '../../../src/modules/attendance/domain/services/dashboard.service';
import { CourseSnapshot } from '../../../src/modules/attendance/domain/value-objects/course-snapshot.vo';

const makeRecord = (
	status: AttendanceStatus,
	courseId: string,
	date: string,
): AttendanceRecord =>
	AttendanceRecord.reconstitute({
		id: `rec-${Math.random()}`,
		tenantId: 'tenant-1',
		studentId: `student-${Math.random()}`,
		courseId,
		date: new Date(`${date}T12:00:00.000Z`),
		status,
		editedBy: 'teacher-1',
		editedAt: new Date(),
		createdAt: new Date(),
	});

describe('GetDashboardMetricsQueryHandler', () => {
	let handler: GetDashboardMetricsQueryHandler;
	let attendanceRepo: MockProxy<IAttendanceRecordRepository>;
	let coursePort: MockProxy<ICoursePort>;
	let academicYearPort: MockProxy<IAcademicYearPort>;
	let dashService: MockProxy<DashboardService>;

	const academicYear = AcademicYear.reconstitute(
		'ay-1',
		75,
		15,
		new Date('2026-03-01'),
		new Date('2026-12-15'),
	);

	const course1 = Course.reconstitute(
		'course-1',
		'3° A',
		'ay-1',
		true,
		LEVEL.PRIMARY,
	);
	const course2 = Course.reconstitute(
		'course-2',
		'3° B',
		'ay-1',
		true,
		LEVEL.SECONDARY,
	);

	beforeEach(() => {
		attendanceRepo = mock<IAttendanceRecordRepository>();
		coursePort = mock<ICoursePort>();
		academicYearPort = mock<IAcademicYearPort>();
		dashService = mock<DashboardService>();
		handler = new GetDashboardMetricsQueryHandler(
			coursePort,
			attendanceRepo,
			academicYearPort,
			dashService,
		);
	});

	it('retorna respuesta vacía si el preceptor no tiene cursos en el año académico', async () => {
		academicYearPort.findById.mockResolvedValue(academicYear);
		coursePort.findByPreceptorId.mockResolvedValue([
			Course.reconstitute('course-x', '1° A', 'ay-other', true, LEVEL.PRIMARY),
		]);

		const result = await handler.execute(
			new GetDashboardMetricsQuery('preceptor-1', 'ay-1'),
		);

		expect(result.averageAttendance).toBe(0);
		expect(result.coursesAtRisk).toEqual([]);
		expect(result.weeklyTrend).toEqual([]);
		expect(dashService.buildCourseSnapshot).not.toHaveBeenCalled();
	});

	it('retorna respuesta vacía si el preceptor no tiene cursos asignados', async () => {
		academicYearPort.findById.mockResolvedValue(academicYear);
		coursePort.findByPreceptorId.mockResolvedValue([]);

		const result = await handler.execute(
			new GetDashboardMetricsQuery('preceptor-1', 'ay-1'),
		);

		expect(result.averageAttendance).toBe(0);
		expect(result.coursesAtRisk).toEqual([]);
		expect(result.weeklyTrend).toEqual([]);
	});

	it('calcula el promedio de asistencia y retorna cursos en riesgo', async () => {
		academicYearPort.findById.mockResolvedValue(academicYear);
		coursePort.findByPreceptorId.mockResolvedValue([course1, course2]);

		const snapshot1 = new CourseSnapshot('course-1', '3° A', 25, 20, 3, 1, 1);
		const snapshot2 = new CourseSnapshot('course-2', '3° B', 30, 21, 6, 2, 1);

		dashService.buildCourseSnapshot
			.mockResolvedValueOnce(snapshot1)
			.mockResolvedValueOnce(snapshot2);

		const records1 = [
			makeRecord(ATTENDANCE_STATUS.PRESENT, 'course-1', '2026-07-07'),
			makeRecord(ATTENDANCE_STATUS.ABSENT, 'course-1', '2026-07-08'),
		];
		const records2 = [
			makeRecord(ATTENDANCE_STATUS.PRESENT, 'course-2', '2026-07-07'),
			makeRecord(ATTENDANCE_STATUS.LATE, 'course-2', '2026-07-08'),
		];

		attendanceRepo.findByCourseAndRange
			.mockResolvedValueOnce(records1)
			.mockResolvedValueOnce(records2);

		dashService.buildWeeklyTrend.mockReturnValue([
			{ mondayWeek: new Date('2026-07-06'), percent: 75 },
		]);

		const result = await handler.execute(
			new GetDashboardMetricsQuery('preceptor-1', 'ay-1'),
		);

		const expectedAvg =
			(snapshot1.presentsPercent + snapshot2.presentsPercent) / 2;
		expect(result.averageAttendance).toBeCloseTo(expectedAvg, 2);
		expect(result.coursesAtRisk).toHaveLength(2);
		expect(result.weeklyTrend).toHaveLength(1);
		expect(result.weeklyTrend[0].percent).toBe(75);
	});

	it('llama a buildCourseSnapshot con startDate y endDate del año académico', async () => {
		academicYearPort.findById.mockResolvedValue(academicYear);
		coursePort.findByPreceptorId.mockResolvedValue([course1]);

		dashService.buildCourseSnapshot.mockResolvedValue(
			new CourseSnapshot('course-1', '3° A', 25, 20, 3, 1, 1),
		);
		attendanceRepo.findByCourseAndRange.mockResolvedValue([]);

		await handler.execute(new GetDashboardMetricsQuery('preceptor-1', 'ay-1'));

		expect(dashService.buildCourseSnapshot).toHaveBeenCalledWith(
			'course-1',
			academicYear.startDate,
			academicYear.endDate,
		);
		expect(attendanceRepo.findByCourseAndRange).toHaveBeenCalledWith(
			'course-1',
			academicYear.startDate,
			academicYear.endDate,
		);
	});

	it('mapea correctamente los statusColor de los snapshots usando umbrales', async () => {
		academicYearPort.findById.mockResolvedValue(academicYear);
		coursePort.findByPreceptorId.mockResolvedValue([course1, course2]);

		const healthySnapshot = new CourseSnapshot(
			'course-1',
			'3° A',
			25,
			23,
			1,
			1,
			0,
		);
		const criticalSnapshot = new CourseSnapshot(
			'course-2',
			'3° B',
			25,
			2,
			20,
			2,
			1,
		);

		dashService.buildCourseSnapshot
			.mockResolvedValueOnce(healthySnapshot)
			.mockResolvedValueOnce(criticalSnapshot);

		attendanceRepo.findByCourseAndRange
			.mockResolvedValueOnce([])
			.mockResolvedValueOnce([]);

		dashService.buildWeeklyTrend.mockReturnValue([]);

		const result = await handler.execute(
			new GetDashboardMetricsQuery('preceptor-1', 'ay-1'),
		);

		expect(result.coursesAtRisk).toHaveLength(2);
		expect(result.coursesAtRisk[0].statusColor).toBe(COURSE_RISK_STATUS.OK);
		expect(result.coursesAtRisk[1].statusColor).toBe(COURSE_RISK_STATUS.CRITICAL);
	});

	it('acumula records de todos los cursos y los pasa a buildWeeklyTrend', async () => {
		academicYearPort.findById.mockResolvedValue(academicYear);
		coursePort.findByPreceptorId.mockResolvedValue([course1, course2]);

		dashService.buildCourseSnapshot
			.mockResolvedValueOnce(
				new CourseSnapshot('course-1', '3° A', 25, 20, 3, 1, 1),
			)
			.mockResolvedValueOnce(
				new CourseSnapshot('course-2', '3° B', 30, 21, 6, 2, 1),
			);

		const records1 = [
			makeRecord(ATTENDANCE_STATUS.PRESENT, 'course-1', '2026-07-07'),
			makeRecord(ATTENDANCE_STATUS.ABSENT, 'course-1', '2026-07-08'),
		];
		const records2 = [
			makeRecord(ATTENDANCE_STATUS.PRESENT, 'course-2', '2026-07-07'),
			makeRecord(ATTENDANCE_STATUS.LATE, 'course-2', '2026-07-08'),
		];

		attendanceRepo.findByCourseAndRange
			.mockResolvedValueOnce(records1)
			.mockResolvedValueOnce(records2);

		dashService.buildWeeklyTrend.mockReturnValue([]);

		await handler.execute(new GetDashboardMetricsQuery('preceptor-1', 'ay-1'));

		expect(dashService.buildWeeklyTrend).toHaveBeenCalledTimes(1);
		const passedRecords = dashService.buildWeeklyTrend.mock.calls[0][0];
		expect(passedRecords).toHaveLength(4);
	});

	it('incluye level del course en cada CourseSnapshotDto', async () => {
		academicYearPort.findById.mockResolvedValue(academicYear);
		coursePort.findByPreceptorId.mockResolvedValue([course1, course2]);

		dashService.buildCourseSnapshot
			.mockResolvedValueOnce(
				new CourseSnapshot('course-1', '3° A', 25, 20, 3, 1, 1),
			)
			.mockResolvedValueOnce(
				new CourseSnapshot('course-2', '3° B', 30, 21, 6, 2, 1),
			);

		attendanceRepo.findByCourseAndRange
			.mockResolvedValueOnce([])
			.mockResolvedValueOnce([]);

		dashService.buildWeeklyTrend.mockReturnValue([]);

		const result = await handler.execute(
			new GetDashboardMetricsQuery('preceptor-1', 'ay-1'),
		);

		expect(result.coursesAtRisk[0].level).toBe(LEVEL.PRIMARY);
		expect(result.coursesAtRisk[1].level).toBe(LEVEL.SECONDARY);
	});
});
