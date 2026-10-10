import { DAYOFWEEK, LEVEL, SHIFT } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { GetMySubjectsHandler } from '../../../../src/modules/academic/application/queries/get-my-subjects/get-my-subjects.handler';
import { GetMySubjectsQuery } from '../../../../src/modules/academic/application/queries/get-my-subjects/get-my-subjects.query';
import { AcademicYear } from '../../../../src/modules/academic/domain/entities/academic-year.entity';
import { Course } from '../../../../src/modules/academic/domain/entities/course.entity';
import { ScheduleSlot } from '../../../../src/modules/academic/domain/entities/schedule-slot.entity';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';
import { IAcademicYearRepository } from '../../../../src/modules/academic/domain/repositories/academic-year.repository.interface';
import { ICourseRepository } from '../../../../src/modules/academic/domain/repositories/course.repository.interface';
import { IScheduleRepository } from '../../../../src/modules/academic/domain/repositories/schedule.repository.interface';
import { ISubjectRepository } from '../../../../src/modules/academic/domain/repositories/subject.repository.interface';

describe('GetMySubjectsHandler', () => {
	let handler: GetMySubjectsHandler;
	let academicYearRepo: MockProxy<IAcademicYearRepository>;
	let courseRepo: MockProxy<ICourseRepository>;
	let subjectRepo: MockProxy<ISubjectRepository>;
	let scheduleRepo: MockProxy<IScheduleRepository>;

	const activeYear = AcademicYear.reconstitute({
		id: 'year-1',
		tenantId: 'tenant-1',
		year: 2026,
		startDate: new Date('2026-03-01'),
		endDate: new Date('2026-12-15'),
		nonWorkingDays: [],
		absenceThresholdPercent: 25,
		lateCountAbscenseAfterMinutes: 15,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});
	const buildCourse = (id: string, division: string) =>
		Course.reconstitute({
			id,
			tenantId: 'tenant-1',
			academicYearId: 'year-1',
			preceptorId: 'preceptor-1',
			level: LEVEL.PRIMARY,
			yearNumber: 1,
			division,
			shift: SHIFT.MORNING,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	const buildSubject = (id: string, courseId: string, name: string) =>
		Subject.reconstitute({
			id,
			courseId,
			teacherId: 'teacher-1',
			name,
			area: 'Ciencias',
			weeklyHours: 4,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	const buildSlot = (
		subjectId: string,
		courseId: string,
		dayOfWeek: DAYOFWEEK,
		startTime: string,
		endTime: string,
	) =>
		ScheduleSlot.reconstitute({
			id: `${subjectId}-${dayOfWeek}-${startTime}`,
			subjectId,
			courseId,
			dayOfWeek,
			startTime,
			endTime,
			createdAt: new Date(),
		});

	beforeEach(() => {
		academicYearRepo = mock<IAcademicYearRepository>();
		courseRepo = mock<ICourseRepository>();
		subjectRepo = mock<ISubjectRepository>();
		scheduleRepo = mock<IScheduleRepository>();
		handler = new GetMySubjectsHandler(
			academicYearRepo,
			courseRepo,
			subjectRepo,
			scheduleRepo,
		);
	});

	it('should return the teacher subjects of the tenant active year with course name and sorted whole-week slots', async () => {
		academicYearRepo.findActive.mockResolvedValue(activeYear);
		courseRepo.findByAcademicYear.mockResolvedValue([
			buildCourse('course-1', 'A'),
			buildCourse('course-2', 'B'),
		]);
		subjectRepo.findByTeacherAndCourses.mockResolvedValue([
			buildSubject('sub-1', 'course-1', 'Matemática'),
			buildSubject('sub-2', 'course-2', 'Lengua'),
		]);
		scheduleRepo.findBySubject.mockImplementation(async (subjectId) =>
			subjectId === 'sub-1'
				? [
						buildSlot('sub-1', 'course-1', DAYOFWEEK.WEDNESDAY, '10:00', '11:00'),
						buildSlot('sub-1', 'course-1', DAYOFWEEK.MONDAY, '10:00', '11:00'),
						buildSlot('sub-1', 'course-1', DAYOFWEEK.MONDAY, '08:00', '09:00'),
					]
				: [],
		);

		const result = await handler.execute(
			new GetMySubjectsQuery('teacher-1', 'tenant-1'),
		);

		expect(academicYearRepo.findActive).toHaveBeenCalledWith('tenant-1');
		expect(courseRepo.findByAcademicYear).toHaveBeenCalledWith('year-1');
		expect(subjectRepo.findByTeacherAndCourses).toHaveBeenCalledWith(
			'teacher-1',
			['course-1', 'course-2'],
		);
		expect(result).toHaveLength(2);
		expect(result[0]).toMatchObject({
			subjectId: 'sub-1',
			name: 'Matemática',
			area: 'Ciencias',
			courseId: 'course-1',
			courseName: '1° A - MORNING',
		});
		expect(result[0].slots).toEqual([
			{ dayOfWeek: DAYOFWEEK.MONDAY, startTime: '08:00', endTime: '09:00' },
			{ dayOfWeek: DAYOFWEEK.MONDAY, startTime: '10:00', endTime: '11:00' },
			{ dayOfWeek: DAYOFWEEK.WEDNESDAY, startTime: '10:00', endTime: '11:00' },
		]);
		expect(result[1]).toMatchObject({
			subjectId: 'sub-2',
			courseId: 'course-2',
			courseName: '1° B - MORNING',
			slots: [],
		});
	});

	it('should return an empty list when the tenant has no active academic year', async () => {
		academicYearRepo.findActive.mockResolvedValue(null);

		const result = await handler.execute(
			new GetMySubjectsQuery('teacher-1', 'tenant-1'),
		);

		expect(result).toEqual([]);
		expect(courseRepo.findByAcademicYear).not.toHaveBeenCalled();
	});

	it('should return an empty list when the active year has no courses', async () => {
		academicYearRepo.findActive.mockResolvedValue(activeYear);
		courseRepo.findByAcademicYear.mockResolvedValue([]);

		const result = await handler.execute(
			new GetMySubjectsQuery('teacher-1', 'tenant-1'),
		);

		expect(result).toEqual([]);
		expect(subjectRepo.findByTeacherAndCourses).not.toHaveBeenCalled();
	});
});
