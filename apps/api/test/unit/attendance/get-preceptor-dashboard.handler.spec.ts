import { ATTENDANCE_STATUS, LEVEL } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { GetPreceptorDashboardQueryHandler } from '../../../src/modules/attendance/application/queries/get-preceptor-dashboard/get-preceptor-dashboard.handler';
import { GetPreceptorDashboardQuery } from '../../../src/modules/attendance/application/queries/get-preceptor-dashboard/get-preceptor-dashboard.query';
import { CourseSnapshotBuilderService } from '../../../src/modules/attendance/application/services/course-snapshot-builder.service';
import { Course } from '../../../src/modules/attendance/domain/entities/course.entity';
import { ICoursePort } from '../../../src/modules/attendance/domain/ports/courses.port.interface';
import { CourseSnapshot } from '../../../src/modules/attendance/domain/value-objects/course-snapshot.vo';

describe('GetPreceptorDashboardQueryHandler', () => {
	let handler: GetPreceptorDashboardQueryHandler;
	let coursePort: MockProxy<ICoursePort>;
	let snapshotBuilder: MockProxy<CourseSnapshotBuilderService>;

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
		coursePort = mock<ICoursePort>();
		snapshotBuilder = mock<CourseSnapshotBuilderService>();
		handler = new GetPreceptorDashboardQueryHandler(coursePort, snapshotBuilder);
	});

	it('retorna dashboard vacío si el preceptor no tiene cursos', async () => {
		coursePort.findByPreceptorId.mockResolvedValue([]);

		const result = await handler.execute(
			new GetPreceptorDashboardQuery('preceptor-1', new Date('2026-07-01')),
		);

		expect(result.courses).toEqual([]);
		expect(snapshotBuilder.buildCourseSnapshot).not.toHaveBeenCalled();
	});

	it('retorna snapshots de todos los cursos del preceptor', async () => {
		coursePort.findByPreceptorId.mockResolvedValue([course1, course2]);

		const snapshot1 = new CourseSnapshot('course-1', '3° A', 25, 20, 3, 1, 1);
		const snapshot2 = new CourseSnapshot('course-2', '3° B', 30, 21, 6, 2, 1);

		snapshotBuilder.buildCourseSnapshot
			.mockResolvedValueOnce(snapshot1)
			.mockResolvedValueOnce(snapshot2);

		const date = new Date('2026-07-01');
		const result = await handler.execute(
			new GetPreceptorDashboardQuery('preceptor-1', date),
		);

		expect(result.courses).toHaveLength(2);
		expect(result.date).toBe(date);
		expect(result.courses[0].courseId).toBe('course-1');
		expect(result.courses[0].level).toBe(LEVEL.PRIMARY);
		expect(result.courses[1].courseId).toBe('course-2');
		expect(result.courses[1].level).toBe(LEVEL.SECONDARY);
	});

	it('llama a buildCourseSnapshot con courseId y date para cada curso', async () => {
		coursePort.findByPreceptorId.mockResolvedValue([course1, course2]);

		snapshotBuilder.buildCourseSnapshot
			.mockResolvedValueOnce(
				new CourseSnapshot('course-1', '3° A', 25, 20, 3, 1, 1),
			)
			.mockResolvedValueOnce(
				new CourseSnapshot('course-2', '3° B', 30, 21, 6, 2, 1),
			);

		const date = new Date('2026-07-01');
		await handler.execute(new GetPreceptorDashboardQuery('preceptor-1', date));

		expect(snapshotBuilder.buildCourseSnapshot).toHaveBeenCalledTimes(2);
		expect(snapshotBuilder.buildCourseSnapshot).toHaveBeenCalledWith(
			'course-1',
			date,
		);
		expect(snapshotBuilder.buildCourseSnapshot).toHaveBeenCalledWith(
			'course-2',
			date,
		);
	});

	it('incluye statusColor en cada snapshot del curso', async () => {
		coursePort.findByPreceptorId.mockResolvedValue([course1]);

		snapshotBuilder.buildCourseSnapshot.mockResolvedValue(
			new CourseSnapshot('course-1', '3° A', 25, 20, 3, 1, 1),
		);

		const result = await handler.execute(
			new GetPreceptorDashboardQuery('preceptor-1', new Date('2026-07-01')),
		);

		expect(result.courses[0].statusColor).toBeDefined();
		expect(result.courses[0].lastUpdated).toBeInstanceOf(Date);
	});
});
