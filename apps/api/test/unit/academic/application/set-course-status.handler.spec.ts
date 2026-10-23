import { LEVEL, SHIFT } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { NotFoundError } from '../../../../src/common/errors';
import { SetCourseStatusCommand } from '../../../../src/modules/academic/application/commands/set-course-status/set-course-status.command';
import { SetCourseStatusHandler } from '../../../../src/modules/academic/application/commands/set-course-status/set-course-status.handler';
import { Course } from '../../../../src/modules/academic/domain/entities/course.entity';
import { ICourseRepository } from '../../../../src/modules/academic/domain/repositories/course.repository.interface';
import { User } from '../../../../src/modules/identity/domain/entities/user.entity';
import { IUserRepository } from '../../../../src/modules/identity/domain/repositories/user.repository.interface';
import { expectRejection } from '../expect-rejection';

// set-course-status.handler.spec.ts
describe('SetCourseStatusHandler', () => {
	let handler: SetCourseStatusHandler;
	let courseRepository: MockProxy<ICourseRepository>;
	let userRepository: MockProxy<IUserRepository>;

	const buildCourse = (isActive: boolean, preceptorId = '') =>
		Course.reconstitute({
			id: 'course-1',
			tenantId: 'tenant-id',
			academicYearId: 'ay-1',
			preceptorId,
			level: LEVEL.PRIMARY,
			yearNumber: 3,
			division: 'A',
			shift: SHIFT.MORNING,
			isActive,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

	beforeEach(() => {
		courseRepository = mock<ICourseRepository>();
		userRepository = mock<IUserRepository>();
		handler = new SetCourseStatusHandler(courseRepository, userRepository);
	});

	it('deactivates an active course and returns it', async () => {
		const course = buildCourse(true);
		courseRepository.findById.mockResolvedValue(course);

		const result = await handler.execute(
			new SetCourseStatusCommand('course-1', 'tenant-id', false),
		);

		expect(course.isActive).toBe(false);
		expect(courseRepository.save).toHaveBeenCalledTimes(1);
		expect(courseRepository.save).toHaveBeenCalledWith(course);
		expect(result.id).toBe('course-1');
		expect(result.isActive).toBe(false);
	});

	it('activates an inactive course and returns it', async () => {
		const course = buildCourse(false);
		courseRepository.findById.mockResolvedValue(course);

		const result = await handler.execute(
			new SetCourseStatusCommand('course-1', 'tenant-id', true),
		);

		expect(course.isActive).toBe(true);
		expect(courseRepository.save).toHaveBeenCalledWith(course);
		expect(result.isActive).toBe(true);
	});

	it('throws not found when the course does not exist', async () => {
		courseRepository.findById.mockResolvedValue(null);

		await expectRejection(
			handler.execute(new SetCourseStatusCommand('course-1', 'tenant-id', false)),
			NotFoundError,
			'Curso no encontrado',
		);
		expect(courseRepository.save).not.toHaveBeenCalled();
	});

	it('throws not found for a course of another tenant without changing it', async () => {
		const course = buildCourse(true);
		courseRepository.findById.mockResolvedValue(course);

		await expectRejection(
			handler.execute(
				new SetCourseStatusCommand('course-1', 'other-tenant', false),
			),
			NotFoundError,
			'Curso no encontrado',
		);
		expect(course.isActive).toBe(true);
		expect(courseRepository.save).not.toHaveBeenCalled();
	});

	describe('preceptor name', () => {
		it('returns the full name of the assigned preceptor', async () => {
			const user = User.reconstitute({
				id: 'preceptor-1',
				email: 'ana@test.com',
				passwordHash: 'hashed',
				firstName: 'Ana',
				lastName: 'Gomez',
				isActive: true,
				mustChangePassword: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			courseRepository.findById.mockResolvedValue(
				buildCourse(true, 'preceptor-1'),
			);
			userRepository.findById.mockResolvedValue(user);

			const result = await handler.execute(
				new SetCourseStatusCommand('course-1', 'tenant-id', false),
			);

			expect(userRepository.findById).toHaveBeenCalledWith('preceptor-1');
			expect(result.preceptorName).toBe('Ana Gomez');
		});

		it('falls back to "Sin asignar" when the preceptor no longer exists', async () => {
			courseRepository.findById.mockResolvedValue(
				buildCourse(true, 'preceptor-gone'),
			);
			userRepository.findById.mockResolvedValue(null);

			const result = await handler.execute(
				new SetCourseStatusCommand('course-1', 'tenant-id', false),
			);

			expect(userRepository.findById).toHaveBeenCalledWith('preceptor-gone');
			expect(result.preceptorName).toBe('Sin asignar');
		});
	});
});
