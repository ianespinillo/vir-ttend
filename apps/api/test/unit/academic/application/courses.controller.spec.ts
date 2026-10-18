import { JwtPayload, LEVEL, ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { AssignPreceptorHandler } from '../../../../src/modules/academic/application/commands/assign-preceptor/assign-preceptor.handler';
import { CreateCourseHandler } from '../../../../src/modules/academic/application/commands/create-course/create-course.handler';
import { DeleteCourseHandler } from '../../../../src/modules/academic/application/commands/delete-course/delete-course.handler';
import { UpdateCourseHandler } from '../../../../src/modules/academic/application/commands/update-course/update-course.handler';
import { GetCourseHandler } from '../../../../src/modules/academic/application/queries/get-course/get-course.handler';
import { GetCoursesByPreceptorHandler } from '../../../../src/modules/academic/application/queries/get-courses-by-preceptor/get-courses-by-preceptor.handler';
import { GetCoursesHandler } from '../../../../src/modules/academic/application/queries/get-courses/get-courses.handler';
import { GetCoursesQuery } from '../../../../src/modules/academic/application/queries/get-courses/get-courses.query';
import { CoursesController } from '../../../../src/modules/academic/presentation/controllers/course.controller';

describe('CoursesController.list (preceptor scoping)', () => {
	let controller: CoursesController;
	let getCoursesHandler: MockProxy<GetCoursesHandler>;

	const preceptorUser: JwtPayload = {
		sub: 'preceptor-uuid-1',
		tenantId: 'tenant-1',
		role: ROLES.PRECEPTOR,
		email: 'preceptor@example.com',
	};

	const adminUser: JwtPayload = {
		sub: 'admin-uuid-1',
		tenantId: 'tenant-1',
		role: ROLES.ADMIN,
		email: 'admin@example.com',
	};

	beforeEach(() => {
		getCoursesHandler = mock<GetCoursesHandler>();
		controller = new CoursesController(
			mock<CreateCourseHandler>(),
			mock<UpdateCourseHandler>(),
			mock<DeleteCourseHandler>(),
			mock<AssignPreceptorHandler>(),
			getCoursesHandler,
			mock<GetCourseHandler>(),
			mock<GetCoursesByPreceptorHandler>(),
		);
	});

	it('forces preceptorId to authenticated user.sub when user has role PRECEPTOR', async () => {
		getCoursesHandler.execute.mockResolvedValue([]);

		await controller.list(preceptorUser, 'ay-1', LEVEL.SECONDARY, undefined);

		expect(getCoursesHandler.execute).toHaveBeenCalledTimes(1);
		const query: GetCoursesQuery = getCoursesHandler.execute.mock.calls[0][0];
		expect(query.academicYearId).toBe('ay-1');
		expect(query.level).toBe(LEVEL.SECONDARY);
		expect(query.preceptorId).toBe(preceptorUser.sub);
	});

	it('overrides any spoofed preceptorId query param with user.sub when role is PRECEPTOR', async () => {
		getCoursesHandler.execute.mockResolvedValue([]);

		await controller.list(preceptorUser, 'ay-1', undefined, 'other-preceptor-id');

		const query: GetCoursesQuery = getCoursesHandler.execute.mock.calls[0][0];
		expect(query.preceptorId).toBe(preceptorUser.sub);
	});

	it('preserves preceptorId parameter when user has role ADMIN', async () => {
		getCoursesHandler.execute.mockResolvedValue([]);

		await controller.list(adminUser, 'ay-1', undefined, 'some-preceptor-id');

		const query: GetCoursesQuery = getCoursesHandler.execute.mock.calls[0][0];
		expect(query.preceptorId).toBe('some-preceptor-id');
	});

	it('leaves preceptorId undefined for ADMIN when not specified', async () => {
		getCoursesHandler.execute.mockResolvedValue([]);

		await controller.list(adminUser, 'ay-1', undefined, undefined);

		const query: GetCoursesQuery = getCoursesHandler.execute.mock.calls[0][0];
		expect(query.preceptorId).toBeUndefined();
	});
});
