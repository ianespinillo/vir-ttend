import { IStudentDetailResponse } from '@repo/common';
import { Student } from '../../domain/entities/student.entity';
import { StudentResponseDto } from './student.response.dto';

// student-detail.response.dto.ts
export class StudentDetailResponseDto
	extends StudentResponseDto
	implements IStudentDetailResponse
{
	tutorName: string;
	tutorPhone: string;
	tutorEmail?: string;

	constructor(student: Student) {
		super(student);
		this.tutorName = student.tutorName;
		this.tutorPhone = student.tutorPhone;
		this.tutorEmail = student.tutorEmail;
	}
}
