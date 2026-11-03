import { SubjectKindType } from '@repo/common';
import { SubjectTeacherAssignment } from '../../../domain/value-objects/subject-teacher-assignment.vo';

export class CreateSubjectCommand {
	constructor(
		readonly courseId: string,
		readonly teacherId: string | undefined,
		readonly name: string,
		readonly area: string,
		readonly weeklyHours: number,
		readonly kind?: SubjectKindType,
		readonly teacherName?: string,
		/** Per-commission teachers; wins over teacherId / teacherName. */
		readonly teachers?: SubjectTeacherAssignment[],
	) {}
}
