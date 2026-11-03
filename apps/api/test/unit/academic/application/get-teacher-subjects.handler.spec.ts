import { LEVEL, SHIFT, SUBJECT_KIND, SubjectKindType } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { GetTeacherSubjectsQueryHandler } from '../../../../src/modules/academic/application/queries/get-teacher-subjects/get-teacher-subjects.handler';
import { GetTeacherSubjectsQuery } from '../../../../src/modules/academic/application/queries/get-teacher-subjects/get-teacher-subjects.query';
import { Course } from '../../../../src/modules/academic/domain/entities/course.entity';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';
import { ICourseRepository } from '../../../../src/modules/academic/domain/repositories/course.repository.interface';
import { ISubjectRepository } from '../../../../src/modules/academic/domain/repositories/subject.repository.interface';
import { IUserRepository } from '../../../../src/modules/identity/domain/repositories/user.repository.interface';

describe('GetTeacherSubjectsQueryHandler', () => {
	let handler: GetTeacherSubjectsQueryHandler;
	let courseRepo: MockProxy<ICourseRepository>;
	let subjectRepo: MockProxy<ISubjectRepository>;
	let userRepo: MockProxy<IUserRepository>;

	const buildCourse = (id: string, yearNumber: number) =>
		Course.reconstitute({
			id,
			tenantId: 'tenant-1',
			academicYearId: 'year-1',
			preceptorId: 'preceptor-1',
			level: LEVEL.SECONDARY,
			yearNumber,
			division: 'A',
			shift: SHIFT.MORNING,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	const buildSubject = (id: string, courseId: string, kind: SubjectKindType) =>
		Subject.reconstitute({
			id,
			courseId,
			teacherId: 'teacher-1',
			name: id,
			area: 'Area',
			weeklyHours: 4,
			kind,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

	beforeEach(() => {
		courseRepo = mock<ICourseRepository>();
		subjectRepo = mock<ISubjectRepository>();
		userRepo = mock<IUserRepository>();
		userRepo.findByIds.mockResolvedValue([]);
		handler = new GetTeacherSubjectsQueryHandler(
			courseRepo,
			subjectRepo,
			userRepo,
		);
	});

	it('flags theory subjects of a workshop-only course as without own attendance', async () => {
		courseRepo.findByAcademicYear.mockResolvedValue([
			buildCourse('course-6', 6),
			buildCourse('course-7', 7),
		]);
		subjectRepo.findByTeacherAndCourses.mockResolvedValue([
			buildSubject('theory-6', 'course-6', SUBJECT_KIND.THEORY),
			buildSubject('theory-7', 'course-7', SUBJECT_KIND.THEORY),
			buildSubject('workshop-7', 'course-7', SUBJECT_KIND.WORKSHOP),
		]);

		const result = await handler.execute(
			new GetTeacherSubjectsQuery('teacher-1', 'year-1'),
		);

		expect(result.map((r) => [r.id, r.hasSubjectAttendance])).toEqual([
			['theory-6', true],
			['theory-7', false],
			['workshop-7', true],
		]);
	});
});
