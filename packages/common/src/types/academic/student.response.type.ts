import { StudentStatus } from '../../constants/student-status.enum.js';

export interface IStudentResponse {
	id: string;
	fullName: string;
	firstName: string;
	lastName: string;
	documentNumber: string;
	birthDate: Date;
	age: number;
	courseId: string;
	status: StudentStatus;
}
