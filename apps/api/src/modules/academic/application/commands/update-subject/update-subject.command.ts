import { SubjectKindType } from '@repo/common';
import { SubjectTeacherAssignment } from '../../../domain/value-objects/subject-teacher-assignment.vo';

export class UpdateSubjectCommand {
	constructor(
		readonly subjectId: string,
		readonly teacherId?: string,
		readonly name?: string,
		readonly area?: string,
		readonly weeklyHours?: number,
		readonly kind?: SubjectKindType,
		readonly teacherName?: string,
		/** Per-commission teachers; replaces every assignment and wins over teacherId / teacherName. */
		readonly teachers?: SubjectTeacherAssignment[],
	) {}
}
