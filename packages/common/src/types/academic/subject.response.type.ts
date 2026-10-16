import type { SubjectKindType } from '../../constants/subject-kind.enum.js';

export interface ISubjectResponse {
	id: string;
	courseId?: string;
	name: string;
	area: string;
	weeklyHours: number;
	/** Always sent by the API; optional here so existing mocks keep compiling. Absent = theory. */
	kind?: SubjectKindType;
	teacherId?: string;
	teacherName?: string;
}
