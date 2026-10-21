import { ATTENDANCE_STATUS } from '@repo/common';
import { CourseSnapshotBuilderService } from '../../../src/modules/attendance/application/services/course-snapshot-builder.service';
import { AttendanceRecord } from '../../../src/modules/attendance/domain/entities/attendance-record.entity';
import { WorkshopAttendanceRecord } from '../../../src/modules/attendance/domain/entities/workshop-attendance-record.entity';

const utc = (day: string) => new Date(`${day}T00:00:00.000Z`);
const MON = utc('2026-03-09');
const TUE = utc('2026-03-10');

const daily = (studentId: string, date: Date, status: string) =>
	AttendanceRecord.reconstitute({
		id: `d-${studentId}-${date.toISOString()}`,
		tenantId: 't',
		studentId,
		courseId: 'course-1',
		date,
		status: status as AttendanceRecord['status'],
		editedBy: 'u',
		editedAt: date,
		createdAt: date,
	});

const workshop = (studentId: string, date: Date, status: string) =>
	WorkshopAttendanceRecord.reconstitute({
		id: `w-${studentId}-${date.toISOString()}`,
		tenantId: 't',
		workshopCommissionId: 'commission-1',
		courseId: 'course-1',
		studentId,
		date,
		status: status as WorkshopAttendanceRecord['status'],
		editedBy: 'u',
		editedAt: date,
		createdAt: date,
	});

describe('CourseSnapshotBuilderService', () => {
	const rawCounts = {
		courseId: 'course-1',
		totalStudents: '2',
		presents: '2',
		absents: '3',
		late: '1',
		justified: '0',
		totalRecords: '6',
	};

	function build(opts: {
		daily?: AttendanceRecord[];
		workshop?: WorkshopAttendanceRecord[];
		workshopOnly?: boolean;
		shift?: string;
	}) {
		const attendanceRepo = {
			getCourseSummaryForDate: jest.fn().mockResolvedValue(rawCounts),
			getCourseSummaryForDateRange: jest.fn().mockResolvedValue(rawCounts),
			findDailyByCourseAndDateRange: jest.fn().mockResolvedValue(opts.daily ?? []),
		};
		const workshopRepo = {
			findByCourseAndDateRange: jest.fn().mockResolvedValue(opts.workshop ?? []),
		};
		const coursePort = {
			findById: jest.fn().mockResolvedValue({
				id: 'course-1',
				name: '3° A',
				academicYearId: 'y',
				isWorkshopOnly: opts.workshopOnly ?? false,
				shift: opts.shift,
			}),
		};
		const attendanceService = {
			getExpectedClassesForCourse: jest.fn().mockResolvedValue(2),
		};
		const service = new CourseSnapshotBuilderService(
			attendanceRepo as never,
			workshopRepo as never,
			coursePort as never,
			attendanceService as never,
		);
		return { service, attendanceRepo, workshopRepo, attendanceService };
	}

	it('reports the weighted absence total of the course over the days given', async () => {
		const { service, workshopRepo, attendanceRepo } = build({
			daily: [
				// Ana: Monday has a workshop record (0.5 + 0.5), Tuesday late (0.25).
				daily('ana', MON, ATTENDANCE_STATUS.ABSENT),
				daily('ana', TUE, ATTENDANCE_STATUS.LATE),
				// Beto: a plain absence (1) and a present day.
				daily('beto', MON, ATTENDANCE_STATUS.ABSENT),
				daily('beto', TUE, ATTENDANCE_STATUS.PRESENT),
			],
			workshop: [workshop('ana', MON, ATTENDANCE_STATUS.ABSENT)],
		});

		const snapshot = await service.buildCourseSnapshot('course-1', MON, TUE);

		expect(snapshot.toJSON().absent).toBe(2.25);
		// 2.25 weighted absences over 4 student-days.
		expect(snapshot.absencePercent).toBeCloseTo(56.25, 5);
		expect(snapshot.presentsPercent).toBeCloseTo(43.75, 5);
		expect(attendanceRepo.findDailyByCourseAndDateRange).toHaveBeenCalledWith(
			'course-1',
			MON,
			TUE,
		);
		expect(workshopRepo.findByCourseAndDateRange).toHaveBeenCalledWith(
			'course-1',
			MON,
			TUE,
		);
	});

	it('asks for the expected classes of the course shift', async () => {
		const { service, attendanceService } = build({ shift: 'MORNING' });

		await service.buildCourseSnapshot('course-1', MON, TUE);

		expect(attendanceService.getExpectedClassesForCourse).toHaveBeenCalledWith(
			MON,
			TUE,
			'course-1',
			'y',
			'MORNING',
		);
	});

	it('weighs workshop absences 1 and flags the snapshot in a workshop-only course', async () => {
		const { service } = build({
			workshop: [workshop('ana', MON, ATTENDANCE_STATUS.ABSENT)],
			workshopOnly: true,
		});

		const json = (
			await service.buildCourseSnapshot('course-1', MON, MON)
		).toJSON();

		expect(json.absent).toBe(1);
		expect(json.workshopOnly).toBe(true);
	});

	it('does not flag a regular course snapshot', async () => {
		const { service } = build({
			workshop: [workshop('ana', MON, ATTENDANCE_STATUS.ABSENT)],
		});

		const json = (
			await service.buildCourseSnapshot('course-1', MON, MON)
		).toJSON();

		expect(json.absent).toBe(0.5);
		expect(json.workshopOnly).toBe(false);
	});

	it('keeps the raw status counts as integers', async () => {
		const { service } = build({});

		const json = (
			await service.buildCourseSnapshot('course-1', MON, TUE)
		).toJSON();

		expect(json).toMatchObject({
			totalStudents: 2,
			present: 2,
			late: 1,
			justified: 0,
		});
	});

	it('reads a single day with the same bulk queries', async () => {
		const { service, attendanceRepo } = build({
			daily: [daily('ana', MON, ATTENDANCE_STATUS.ABSENT)],
		});

		const snapshot = await service.buildCourseSnapshot('course-1', MON, MON);

		expect(attendanceRepo.getCourseSummaryForDate).toHaveBeenCalled();
		expect(attendanceRepo.getCourseSummaryForDateRange).not.toHaveBeenCalled();
		expect(attendanceRepo.findDailyByCourseAndDateRange).toHaveBeenCalledWith(
			'course-1',
			MON,
			MON,
		);
		expect(snapshot.toJSON().absent).toBe(1);
	});

	it('treats a missing end date as a single day', async () => {
		const { service, attendanceRepo } = build({});

		await service.buildCourseSnapshot('course-1', MON);

		expect(attendanceRepo.getCourseSummaryForDate).toHaveBeenCalledWith(
			'course-1',
			MON,
		);
	});
});
