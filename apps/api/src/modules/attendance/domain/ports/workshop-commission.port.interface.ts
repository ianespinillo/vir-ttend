import { CommissionNumber, DAYOFWEEK } from '@repo/common';
import { Student } from '../entities/student.entity';

/** Read model of a workshop commission, as the attendance module sees it. */
export interface WorkshopCommissionInfo {
	id: string;
	tenantId: string;
	courseId: string;
	/** Course label, e.g. "1° 4°". */
	courseName: string;
	number: CommissionNumber;
	/** Commission code derived from the course, e.g. "141". */
	code: string;
	preceptorId: string | null;
}

export interface IWorkshopCommissionPort {
	findById(commissionId: string): Promise<WorkshopCommissionInfo | null>;
	/** The commission the student belongs to, if any. */
	findByStudent(studentId: string): Promise<WorkshopCommissionInfo | null>;
	/** Commissions of active courses the user is the workshop preceptor of. */
	findByPreceptor(preceptorId: string): Promise<WorkshopCommissionInfo[]>;
	/** Commissions of the active courses of the tenant. */
	findByTenant(tenantId: string): Promise<WorkshopCommissionInfo[]>;
	/** ACTIVE students of the commission, sorted by last name, then first name. */
	getActiveStudents(commissionId: string): Promise<Student[]>;
	/**
	 * Weekdays on which the course has a workshop-subject slot that targets the
	 * commission number (slots with no commission target both).
	 */
	getWorkshopDays(
		courseId: string,
		commissionNumber: CommissionNumber,
	): Promise<DAYOFWEEK[]>;
}
