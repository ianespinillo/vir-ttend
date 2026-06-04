import { IsUUID } from 'class-validator';

// enroll-student.request.dto.ts
export class EnrollStudentRequestDto {
	@IsUUID() courseId!: string;
}
