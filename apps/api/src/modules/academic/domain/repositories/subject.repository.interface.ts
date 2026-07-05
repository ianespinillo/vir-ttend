import { Subject } from '../entities/subject.entity';

export interface ISubjectRepository {
	findById(id: string): Promise<Subject | null>;
	findByTeacher(teacherId: string): Promise<Subject[]>;
	findByTeacherAndCourses(
		teacherId: string,
		courses: string[],
	): Promise<Subject[]>;
	findByCourse(courseId: string): Promise<Subject[]>;
	save(subject: Subject): Promise<void>;
}
