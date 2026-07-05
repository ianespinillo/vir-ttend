import { Subject } from '../entities/subject.entity';

export interface ISubjectPort {
	getSubjectById(subjectId: string): Promise<Subject | null>;
	getByTeacherAndCourses(
		teacherId: string,
		courseId: string[],
	): Promise<Subject[]>;
}
