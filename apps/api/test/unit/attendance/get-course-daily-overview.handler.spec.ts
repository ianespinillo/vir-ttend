import { NotFoundException } from '@nestjs/common';
import { ATTENDANCE_STATUS, LEVEL } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { GetCourseDailyOverviewQueryHandler } from '../../../src/modules/attendance/application/queries/get-course-daily-overview/get-course-daily-overview.handler';
import { GetCourseDailyOverviewQuery } from '../../../src/modules/attendance/application/queries/get-course-daily-overview/get-course-daily-overview.query';
import { CourseSnapshotBuilderService } from '../../../src/modules/attendance/application/services/course-snapshot-builder.service';
import { AttendanceRecord } from '../../../src/modules/attendance/domain/entities/attendance-record.entity';
import { Course } from '../../../src/modules/attendance/domain/entities/course.entity';
import { ICoursePort } from '../../../src/modules/attendance/domain/ports/courses.port.interface';
import { IAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/attendance-record.repository.interface';
import { CourseSnapshot } from '../../../src/modules/attendance/domain/value-objects/course-snapshot.vo';

describe('GetCourseDailyOverviewQueryHandler', () => {
	let handler: GetCourseDailyOverviewQueryHandler;
	let attendanceRepo: MockProxy<IAttendanceRecordRepository>;
	let coursePort: MockProxy<ICoursePort>;
	let snapshotBuilder: MockProxy<CourseSnapshotBuilderService>;

	const course = Course.reconstitute(
		'course-1',
		'3° B',
		'ay-1',
		true,
		LEVEL.SECONDARY,
	);

	beforeEach(() => {
		attendanceRepo = mock<IAttendanceRecordRepository>();
		coursePort = mock<ICoursePort>();
		snapshotBuilder = mock<CourseSnapshotBuilderService>();
		handler = new GetCourseDailyOverviewQueryHandler(
			attendanceRepo,
			coursePort,
			snapshotBuilder,
		);
	});

	it('lanza NotFoundException si el curso no existe', async () => {
		coursePort.findById.mockResolvedValue(null);

		await expect(
			handler.execute(
				new GetCourseDailyOverviewQuery('course-999', new Date('2026-07-01')),
			),
		).rejects.toThrow(NotFoundException);
	});

	it('retorna records y snapshot del curso para la fecha dada', async () => {
		coursePort.findById.mockResolvedValue(course);

		const records = [
			AttendanceRecord.reconstitute({
				id: 'rec-1',
				tenantId: 'tenant-1',
				studentId: 'student-1',
				courseId: 'course-1',
				date: new Date('2026-07-01T12:00:00.000Z'),
				status: ATTENDANCE_STATUS.PRESENT,
				editedBy: 'teacher-1',
				editedAt: new Date(),
				createdAt: new Date(),
			}),
		];
		attendanceRepo.findByCourseAndDate.mockResolvedValue(records);

		const snapshot = new CourseSnapshot('course-1', '3° B', 25, 20, 3, 1, 1);
		snapshotBuilder.buildCourseSnapshot.mockResolvedValue(snapshot);

		const date = new Date('2026-07-01');
		const result = await handler.execute(
			new GetCourseDailyOverviewQuery('course-1', date),
		);

		expect(result.records).toEqual(records);
		expect(result.courseId).toBe('course-1');
		expect(result.courseName).toBe('3° B');
		expect(result.level).toBe(LEVEL.SECONDARY);
		expect(result.statusColor).toBeDefined();
		expect(result.lastUpdated).toBeInstanceOf(Date);
	});

	it('llama a buildCourseSnapshot con courseId y date', async () => {
		coursePort.findById.mockResolvedValue(course);
		attendanceRepo.findByCourseAndDate.mockResolvedValue([]);
		snapshotBuilder.buildCourseSnapshot.mockResolvedValue(
			new CourseSnapshot('course-1', '3° B', 0, 0, 0, 0, 0),
		);

		const date = new Date('2026-07-01');
		await handler.execute(new GetCourseDailyOverviewQuery('course-1', date));

		expect(snapshotBuilder.buildCourseSnapshot).toHaveBeenCalledWith(
			'course-1',
			date,
		);
	});

	it('retorna records vacíos cuando no hay asistencia registrada', async () => {
		coursePort.findById.mockResolvedValue(course);
		attendanceRepo.findByCourseAndDate.mockResolvedValue([]);
		snapshotBuilder.buildCourseSnapshot.mockResolvedValue(
			new CourseSnapshot('course-1', '3° B', 25, 0, 0, 0, 0),
		);

		const result = await handler.execute(
			new GetCourseDailyOverviewQuery('course-1', new Date('2026-07-01')),
		);

		expect(result.records).toEqual([]);
	});
});
