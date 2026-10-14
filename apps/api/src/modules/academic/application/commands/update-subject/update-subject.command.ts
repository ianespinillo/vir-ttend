import { SubjectKindType } from '@repo/common';

export class UpdateSubjectCommand {
	constructor(
		readonly subjectId: string,
		readonly teacherId?: string,
		readonly area?: string,
		readonly name?: string,
		readonly weeklyHours?: number,
		readonly kind?: SubjectKindType,
	) {}
}
