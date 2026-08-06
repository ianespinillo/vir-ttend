import { StudentStatus } from '../../constants/student-status.enum.js';

export interface IStudentResponse {
	id: string;
	fullName: string;
	firstName: string;
	lastName: string;
	documentNumber: string;
	birthDate: Date | string;
	age: number;
	courseId: string;
	courseName?: string;
	status: StudentStatus;
}
