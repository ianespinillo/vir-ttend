import { JwtPayload, ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { AssignTeacherHandler } from '../../../../src/modules/academic/application/commands/assign-teaher/assign-teacher.handler';
import { CreateSubjectHandler } from '../../../../src/modules/academic/application/commands/create-subject/create-subject.handler';
import { DeleteSubjectHandler } from '../../../../src/modules/academic/application/commands/delete-subject/delete-subject.handler';
import { UpdateSubjectCommand } from '../../../../src/modules/academic/application/commands/update-subject/update-subject.command';
import { UpdateSubjectHandler } from '../../../../src/modules/academic/application/commands/update-subject/update-subject.handler';
import { SubjectResponseDto } from '../../../../src/modules/academic/application/dtos/subject.response.dto';
import { GetMySubjectsHandler } from '../../../../src/modules/academic/application/queries/get-my-subjects/get-my-subjects.handler';
import { GetMySubjectsQuery } from '../../../../src/modules/academic/application/queries/get-my-subjects/get-my-subjects.query';
import { GetSubjectStudentsHandler } from '../../../../src/modules/academic/application/queries/get-subject-students/get-subject-students.handler';
import { GetSubjectStudentsQuery } from '../../../../src/modules/academic/application/queries/get-subject-students/get-subject-students.query';
import { GetSubjectsByCourseHandler } from '../../../../src/modules/academic/application/queries/get-subjects-by-course/get-subjects-by-course.handler';
import { GetTeacherSubjectsQueryHandler } from '../../../../src/modules/academic/application/queries/get-teacher-subjects/get-teacher-subjects.handler';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';
import { SubjectsController } from '../../../../src/modules/academic/presentation/controllers/subjects.controller';

describe('SubjectsController (teacher endpoints)', () => {
	let controller: SubjectsController;
	let getMySubjectsHandler: MockProxy<GetMySubjectsHandler>;
	let getSubjectStudentsHandler: MockProxy<GetSubjectStudentsHandler>;
	let updateSubjectHandler: MockProxy<UpdateSubjectHandler>;

	const teacher: JwtPayload = {
		sub: 'teacher-1',
		tenantId: 'tenant-1',
		role: ROLES.TEACHER,
		email: 'teacher@example.com',
	};

	beforeEach(() => {
		getMySubjectsHandler = mock<GetMySubjectsHandler>();
		getSubjectStudentsHandler = mock<GetSubjectStudentsHandler>();
		updateSubjectHandler = mock<UpdateSubjectHandler>();
		controller = new SubjectsController(
			mock<CreateSubjectHandler>(),
			updateSubjectHandler,
			mock<DeleteSubjectHandler>(),
			mock<AssignTeacherHandler>(),
			mock<GetSubjectsByCourseHandler>(),
			mock<GetTeacherSubjectsQueryHandler>(),
			getMySubjectsHandler,
			getSubjectStudentsHandler,
		);
	});

	it('update maps dto.name and dto.area to the matching command fields', async () => {
		await controller.update('sub-1', {
			teacherId: 'teacher-2',
			name: 'Matemática',
			area: 'Exactas',
			weeklyHours: 4,
		});

		const command = updateSubjectHandler.execute.mock.calls[0][0];
		expect(command).toBeInstanceOf(UpdateSubjectCommand);
		expect(command).toMatchObject({
			subjectId: 'sub-1',
			teacherId: 'teacher-2',
			name: 'Matemática',
			area: 'Exactas',
			weeklyHours: 4,
		});
	});

	it('mine scopes the query to the authenticated user and tenant', async () => {
		getMySubjectsHandler.execute.mockResolvedValue([]);

		await controller.mine(teacher);

		const query = getMySubjectsHandler.execute.mock.calls[0][0];
		expect(query).toBeInstanceOf(GetMySubjectsQuery);
		expect(query).toMatchObject({
			teacherId: 'teacher-1',
			tenantId: 'tenant-1',
		});
	});

	it('students forwards the requester identity and role for the ownership check', async () => {
		getSubjectStudentsHandler.execute.mockResolvedValue([]);

		await controller.students('sub-1', teacher);

		const query = getSubjectStudentsHandler.execute.mock.calls[0][0];
		expect(query).toBeInstanceOf(GetSubjectStudentsQuery);
		expect(query).toMatchObject({
			subjectId: 'sub-1',
			tenantId: 'tenant-1',
			requesterId: 'teacher-1',
			requesterRole: ROLES.TEACHER,
		});
	});

	it('declares mine before any parameterised route and restricts roles', () => {
		const routes = Object.getOwnPropertyNames(SubjectsController.prototype);
		expect(routes.indexOf('mine')).toBeLessThan(routes.indexOf('students'));
		expect(
			Reflect.getMetadata('roles', SubjectsController.prototype.mine),
		).toEqual([ROLES.TEACHER, ROLES.ADMIN]);
		expect(
			Reflect.getMetadata('roles', SubjectsController.prototype.students),
		).toEqual([ROLES.TEACHER, ROLES.ADMIN, ROLES.PRECEPTOR]);
		expect(Reflect.getMetadata('path', SubjectsController.prototype.mine)).toBe(
			'mine',
		);
	});

	it('SubjectResponseDto exposes courseId so clients can register attendance', () => {
		const subject = Subject.reconstitute({
			id: 'sub-1',
			courseId: 'course-1',
			teacherId: 'teacher-1',
			name: 'Matemática',
			area: 'Ciencias',
			weeklyHours: 4,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		expect(new SubjectResponseDto(subject).courseId).toBe('course-1');
	});

	it('SubjectResponseDto exposes teacherName when provided', () => {
		const subject = Subject.reconstitute({
			id: 'sub-1',
			courseId: 'course-1',
			teacherId: 'teacher-1',
			name: 'Matemática',
			area: 'Ciencias',
			weeklyHours: 4,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		expect(new SubjectResponseDto(subject, 'Ada Lovelace').teacherName).toBe(
			'Ada Lovelace',
		);
		expect(new SubjectResponseDto(subject).teacherName).toBeUndefined();
	});
});
