import { LEVEL, SHIFT, SUBJECT_KIND } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { Course } from '../../../src/modules/academic/domain/entities/course.entity';
import { Subject as AcademicSubject } from '../../../src/modules/academic/domain/entities/subject.entity';
import { ICourseRepository } from '../../../src/modules/academic/domain/repositories/course.repository.interface';
import { ISubjectRepository } from '../../../src/modules/academic/domain/repositories/subject.repository.interface';
import { SubjectAdapter } from '../../../src/modules/attendance/infrastructure/adapters/subject.adapter';

describe('SubjectAdapter teachers', () => {
	let subjectRepo: MockProxy<ISubjectRepository>;
	let courseRepo: MockProxy<ICourseRepository>;
	let adapter: SubjectAdapter;

	const split = AcademicSubject.reconstitute({
		id: 'sub-1',
		courseId: 'course-1',
		kind: SUBJECT_KIND.WORKSHOP,
		teachers: [
			{ commissionNumber: 1, teacherId: 'teacher-a' },
			{ commissionNumber: 2, teacherName: 'Laura Gómez' },
		],
		name: 'Carpintería',
		area: 'Taller',
		weeklyHours: 4,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	beforeEach(() => {
		subjectRepo = mock<ISubjectRepository>();
		courseRepo = mock<ICourseRepository>();
		adapter = new SubjectAdapter(subjectRepo, courseRepo);
		courseRepo.findById.mockResolvedValue(
			Course.reconstitute({
				id: 'course-1',
				tenantId: 'tenant-1',
				academicYearId: 'ay-1',
				preceptorId: 'preceptor-1',
				level: LEVEL.SECONDARY,
				yearNumber: 3,
				division: 'A',
				shift: SHIFT.MORNING,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		);
	});

	it('carries the account teachers per commission and skips manual names', async () => {
		subjectRepo.findById.mockResolvedValue(split);

		const subject = await adapter.getSubjectById('sub-1');

		expect(subject?.tenantId).toBe('tenant-1');
		expect(subject?.teachers).toEqual([
			{ commissionNumber: 1, teacherId: 'teacher-a' },
		]);
		expect(subject?.commissionsTaughtBy('teacher-a')).toEqual([1]);
	});

	it('maps the teacher subjects with their assignments', async () => {
		subjectRepo.findByTeacherAndCourses.mockResolvedValue([split]);

		const [subject] = await adapter.getByTeacherAndCourses('teacher-a', [
			'course-1',
		]);

		expect(subject.isTaughtBy('teacher-a')).toBe(true);
		expect(subject.isTaughtBy('teacher-b')).toBe(false);
	});
});
