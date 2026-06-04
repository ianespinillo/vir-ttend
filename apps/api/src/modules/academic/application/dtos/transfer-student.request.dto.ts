import { IsUUID } from 'class-validator';

// transfer-student.request.dto.ts
export class TransferStudentRequestDto {
	@IsUUID() newCourseId!: string;
}
