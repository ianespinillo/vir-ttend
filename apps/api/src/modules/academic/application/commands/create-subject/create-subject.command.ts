import { SubjectKindType } from '@repo/common';

export class CreateSubjectCommand {
	constructor(
		readonly courseId: string,
		readonly teacherId: string,
		readonly name: string,
		readonly area: string,
		readonly weeklyHours: number,
		readonly kind?: SubjectKindType,
	) {}
}
