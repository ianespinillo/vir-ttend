import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ATTENDANCE_STATUS, ROLES, Roles } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { GetSubjectAttendanceQueryHandler } from '../../../src/modules/attendance/application/queries/get-subject-attendance/get-subject-attendance.handler';
import { GetSubjectAttendanceQuery } from '../../../src/modules/attendance/application/queries/get-subject-attendance/get-subject-attendance.query';
import { AttendanceRecord } from '../../../src/modules/attendance/domain/entities/attendance-record.entity';
import { Student } from '../../../src/modules/attendance/domain/entities/student.entity';
import { Subject } from '../../../src/modules/attendance/domain/entities/subject.entity';
import { IStudentPort } from '../../../src/modules/attendance/domain/ports/student.port.interface';
import { ISubjectPort } from '../../../src/modules/attendance/domain/ports/subject.port.interface';
import { IAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/attendance-record.repository.interface';

describe('GetSubjectAttendanceQueryHandler', () => {
	let handler: GetSubjectAttendanceQueryHandler;
	let subjectPort: MockProxy<ISubjectPort>;
	let attendanceRepo: MockProxy<IAttendanceRecordRepository>;
	let studentPort: MockProxy<IStudentPort>;

	const date = new Date('2026-07-06');
	const buildQuery = (
		userId = 'teacher-1',
		role: Roles = ROLES.TEACHER,
		tenantId = 'tenant-1',
	) => new GetSubjectAttendanceQuery('sub-1', date, userId, role, tenantId);
	const buildRecord = (studentId: string, status: 'present' | 'absent') =>
		AttendanceRecord.reconstitute({
			id: `record-${studentId}`,
			tenantId: 'tenant-1',
			studentId,
			courseId: 'course-1',
			subjectId: 'sub-1',
			date,
			status,
			editedBy: 'teacher-1',
			editedAt: new Date('2026-07-06T08:00:00Z'),
			createdAt: new Date('2026-07-06T08:00:00Z'),
		});

	beforeEach(() => {
		subjectPort = mock<ISubjectPort>();
		attendanceRepo = mock<IAttendanceRecordRepository>();
		studentPort = mock<IStudentPort>();
		handler = new GetSubjectAttendanceQueryHandler(
			subjectPort,
			attendanceRepo,
			studentPort,
		);
		subjectPort.getSubjectById.mockResolvedValue(
			Subject.reconstitute('sub-1', 'course-1', 'Math', 'teacher-1', 'tenant-1'),
		);
		studentPort.getActiveByCourseId.mockResolvedValue([
			Student.reconstitute('student-2', 'Perez, Zoe'),
			Student.reconstitute('student-1', 'Garcia, Ana'),
			Student.reconstitute('student-3', 'Lopez, Leo'),
		]);
		attendanceRepo.findBySubjectAndDate.mockResolvedValue([
			buildRecord('student-1', ATTENDANCE_STATUS.PRESENT),
			buildRecord('student-2', ATTENDANCE_STATUS.ABSENT),
		]);
	});

	it('should return the full active roster, with no status for unrecorded students', async () => {
		const result = await handler.execute(buildQuery());

		expect(studentPort.getActiveByCourseId).toHaveBeenCalledWith('course-1');
		expect(result.records.map((r) => r.studentId)).toEqual([
			'student-1',
			'student-3',
			'student-2',
		]);
		expect(result.records.map((r) => r.status)).toEqual([
			ATTENDANCE_STATUS.PRESENT,
			undefined,
			ATTENDANCE_STATUS.ABSENT,
		]);
		expect(result.records[1].id).toBeUndefined();
		expect(result.records[0].id).toBe('record-student-1');
	});

	it('should compute metrics over the whole roster', async () => {
		const result = await handler.execute(buildQuery());

		expect(result.metrics).toEqual({
			totalStudents: 3,
			present: 1,
			absent: 1,
			late: 0,
			justified: 0,
		});
	});

	it('should return subject identity and an ISO calendar date', async () => {
		const result = await handler.execute(buildQuery());

		expect(result).toMatchObject({
			subjectId: 'sub-1',
			subjectName: 'Math',
			courseId: 'course-1',
			date: '2026-07-06',
		});
	});

	it('should return a roster with no statuses when nothing was recorded', async () => {
		attendanceRepo.findBySubjectAndDate.mockResolvedValue([]);

		const result = await handler.execute(buildQuery());

		expect(result.records).toHaveLength(3);
		expect(result.records.every((r) => r.status === undefined)).toBe(true);
		expect(result.metrics.totalStudents).toBe(3);
		expect(result.metrics.present).toBe(0);
	});

	it.each([
		['the owner teacher', 'teacher-1', ROLES.TEACHER],
		['an admin', 'admin-1', ROLES.ADMIN],
		['a preceptor', 'preceptor-1', ROLES.PRECEPTOR],
	])('should allow %s to read', async (_label, userId, role) => {
		await expect(
			handler.execute(buildQuery(userId, role)),
		).resolves.toBeDefined();
	});

	it('should reject another teacher', async () => {
		await expect(
			handler.execute(buildQuery('other-teacher', ROLES.TEACHER)),
		).rejects.toThrow(ForbiddenException);
		expect(attendanceRepo.findBySubjectAndDate).not.toHaveBeenCalled();
		expect(studentPort.getActiveByCourseId).not.toHaveBeenCalled();
	});

	it('should reject when subject belongs to another tenant', async () => {
		await expect(
			handler.execute(buildQuery('teacher-1', ROLES.TEACHER, 'other-tenant')),
		).rejects.toThrow(ForbiddenException);
	});

	it('should fail with a bad request when the subject does not exist', async () => {
		subjectPort.getSubjectById.mockResolvedValue(null);

		await expect(handler.execute(buildQuery())).rejects.toThrow(
			BadRequestException,
		);
	});

	it('should fail with a bad request when the date is invalid', async () => {
		await expect(
			handler.execute(
				new GetSubjectAttendanceQuery(
					'sub-1',
					new Date('not-a-date'),
					'teacher-1',
					ROLES.TEACHER,
					'tenant-1',
				),
			),
		).rejects.toThrow('Invalid date');
	});
});
