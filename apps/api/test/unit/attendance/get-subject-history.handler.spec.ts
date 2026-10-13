import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ATTENDANCE_STATUS, ROLES, Roles } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { GetSubjectHistoryQueryHandler } from '../../../src/modules/attendance/application/queries/get-subject-history/get-subject-history.handler';
import { GetSubjectHistoryQuery } from '../../../src/modules/attendance/application/queries/get-subject-history/get-subject-history.query';
import { AttendanceRecord } from '../../../src/modules/attendance/domain/entities/attendance-record.entity';
import { Student } from '../../../src/modules/attendance/domain/entities/student.entity';
import { Subject } from '../../../src/modules/attendance/domain/entities/subject.entity';
import { IStudentPort } from '../../../src/modules/attendance/domain/ports/student.port.interface';
import { ISubjectPort } from '../../../src/modules/attendance/domain/ports/subject.port.interface';
import { IAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/attendance-record.repository.interface';

describe('GetSubjectHistoryQueryHandler', () => {
	let handler: GetSubjectHistoryQueryHandler;
	let attendanceRepo: MockProxy<IAttendanceRecordRepository>;
	let subjectPort: MockProxy<ISubjectPort>;
	let studentPort: MockProxy<IStudentPort>;

	const from = new Date('2026-07-01');
	const to = new Date('2026-07-10');
	const buildQuery = (
		userId = 'teacher-1',
		role: Roles = ROLES.TEACHER,
		tenantId = 'tenant-1',
	) => new GetSubjectHistoryQuery('sub-1', from, to, userId, role, tenantId);

	beforeEach(() => {
		attendanceRepo = mock<IAttendanceRecordRepository>();
		subjectPort = mock<ISubjectPort>();
		studentPort = mock<IStudentPort>();
		handler = new GetSubjectHistoryQueryHandler(
			attendanceRepo,
			subjectPort,
			studentPort,
		);
		subjectPort.getSubjectById.mockResolvedValue(
			Subject.reconstitute('sub-1', 'course-1', 'Math', 'teacher-1', 'tenant-1'),
		);
		attendanceRepo.findBySubjectAndDateRange.mockResolvedValue([]);
	});

	it.each([
		['owner teacher', 'teacher-1', ROLES.TEACHER],
		['admin', 'admin-1', ROLES.ADMIN],
		['preceptor', 'preceptor-1', ROLES.PRECEPTOR],
	])('should allow %s to view subject history', async (_label, userId, role) => {
		const result = await handler.execute(buildQuery(userId, role));
		expect(result).toBeDefined();
		expect(result.subjectId).toBe('sub-1');
	});

	it('should reject another teacher with ForbiddenException', async () => {
		await expect(
			handler.execute(buildQuery('other-teacher', ROLES.TEACHER)),
		).rejects.toThrow(ForbiddenException);
		expect(attendanceRepo.findBySubjectAndDateRange).not.toHaveBeenCalled();
	});

	it('should reject cross-tenant requester with ForbiddenException', async () => {
		await expect(
			handler.execute(buildQuery('teacher-1', ROLES.TEACHER, 'other-tenant')),
		).rejects.toThrow(ForbiddenException);
		expect(attendanceRepo.findBySubjectAndDateRange).not.toHaveBeenCalled();
	});

	it('should throw NotFoundException when subject does not exist', async () => {
		subjectPort.getSubjectById.mockResolvedValue(null);
		await expect(handler.execute(buildQuery())).rejects.toThrow(
			NotFoundException,
		);
	});
});
