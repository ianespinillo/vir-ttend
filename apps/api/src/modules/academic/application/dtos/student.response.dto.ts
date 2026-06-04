import { IStudentResponse, StudentStatus } from '@repo/common';
import { Student } from '../../domain/entities/student.entity';

// student.response.dto.ts
export class StudentResponseDto implements IStudentResponse {
	id: string;
	fullName: string;
	firstName: string;
	lastName: string;
	documentNumber: string;
	birthDate: Date;
	age: number;
	courseId: string;
	status: StudentStatus;

	constructor(student: Student) {
		this.id = student.id;
		this.fullName = student.fullName;
		this.firstName = student.firstName;
		this.lastName = student.lastName;
		this.documentNumber = student.documentNumber.getValue();
		this.birthDate = student.birthDate;
		this.age = student.age;
		this.courseId = student.courseId;
		this.status = student.status;
	}
}
