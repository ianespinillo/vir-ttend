import { ATTENDANCE_STATUS, AttendanceStatus, ROLES } from '@repo/common';
import { Student } from '../../../src/modules/attendance/domain/entities/student.entity';
import { WorkshopAttendanceRecord } from '../../../src/modules/attendance/domain/entities/workshop-attendance-record.entity';
import {
	IWorkshopCommissionPort,
	WorkshopCommissionInfo,
} from '../../../src/modules/attendance/domain/ports/workshop-commission.port.interface';
import { IWorkshopAttendanceRecordRepository } from '../../../src/modules/attendance/domain/repositories/workshop-attendance-record.repository.interface';

export const TENANT = 'tenant-1';
export const PRECEPTOR_ID = 'preceptor-1';
export const DATE = new Date('2026-03-10');

export const commission = (
	overrides: Partial<WorkshopCommissionInfo> = {},
): WorkshopCommissionInfo => ({
	id: 'commission-1',
	tenantId: TENANT,
	courseId: 'course-1',
	courseName: '1° 4°',
	number: 1,
	code: '141',
	preceptorId: PRECEPTOR_ID,
	...overrides,
});

export const asPreceptor = (userId = PRECEPTOR_ID) => ({
	userId,
	role: ROLES.PRECEPTOR,
	tenantId: TENANT,
});

export function buildPort(
	info: WorkshopCommissionInfo | null,
	students: Student[] = [],
): jest.Mocked<IWorkshopCommissionPort> {
	return {
		findById: jest.fn().mockResolvedValue(info),
		findByStudent: jest.fn().mockResolvedValue(info),
		findByPreceptor: jest.fn().mockResolvedValue(info ? [info] : []),
		findByTenant: jest.fn().mockResolvedValue(info ? [info] : []),
		getActiveStudents: jest.fn().mockResolvedValue(students),
		getWorkshopDays: jest.fn().mockResolvedValue([]),
	};
}

/** In-memory repository keyed by student id for a single commission and date. */
export function buildRepo(
	initial: WorkshopAttendanceRecord[] = [],
): jest.Mocked<IWorkshopAttendanceRecordRepository> & {
	saved: WorkshopAttendanceRecord[][];
} {
	const store = new Map(initial.map((r) => [r.studentId, r]));
	const saved: WorkshopAttendanceRecord[][] = [];
	return {
		saved,
		findByCommissionAndDate: jest
			.fn()
			.mockImplementation(async () => [...store.values()]),
		findByStudentAndDateRange: jest.fn().mockResolvedValue([]),
		findByCourseAndDateRange: jest.fn().mockResolvedValue([]),
		bulkSave: jest.fn().mockImplementation(async (records) => {
			saved.push(records);
			for (const r of records) store.set(r.studentId, r);
		}),
	};
}

export const student = (id: string, name = id) =>
	Student.reconstitute(id, name);

export const existingRecord = (
	studentId: string,
	status: AttendanceStatus = ATTENDANCE_STATUS.PRESENT,
) =>
	WorkshopAttendanceRecord.create({
		tenantId: TENANT,
		workshopCommissionId: 'commission-1',
		courseId: 'course-1',
		studentId,
		date: DATE,
		status,
		editedBy: PRECEPTOR_ID,
	});
