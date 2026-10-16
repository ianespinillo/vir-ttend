import type { CommissionNumber } from '../../constants/subject-kind.enum.js';

export interface IWorkshopCommissionStudentResponse {
	id: string;
	lastName: string;
	firstName: string;
}

export interface IWorkshopCommissionResponse {
	id: string;
	courseId: string;
	number: CommissionNumber;
	/** Derived by the API from the course: year + division + number (e.g. "141"). */
	code: string;
	preceptorId: string | null;
	studentCount: number;
	/** Active students, sorted alphabetically by last name, then first name. */
	students: IWorkshopCommissionStudentResponse[];
}
