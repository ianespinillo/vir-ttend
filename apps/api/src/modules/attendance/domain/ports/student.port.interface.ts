import { Student } from '../entities/student.entity';

export interface IStudentPort {
	getByCourseId(courseId: string): Promise<Student[]>;
	/** Students of the course whose status is ACTIVE. */
	getActiveByCourseId(courseId: string): Promise<Student[]>;
	findById(studentId: string): Promise<Student | null>;
}
