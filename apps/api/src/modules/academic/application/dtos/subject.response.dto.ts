import { ISubjectResponse } from '@repo/common';
import { Subject } from '../../domain/entities/subject.entity';

// subject.response.dto.ts
export class SubjectResponseDto implements ISubjectResponse {
	id: string;
	name: string;
	area: string;
	weeklyHours: number;
	teacherId: string;

	constructor(subject: Subject) {
		this.id = subject.id.getRaw();
		this.name = subject.name;
		this.area = subject.area;
		this.weeklyHours = subject.weeklyHours;
		this.teacherId = subject.teacherId;
	}
}
