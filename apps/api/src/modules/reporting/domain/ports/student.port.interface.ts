import { Student } from '../entities/student.entity';

export interface IStudentPort {
	findStudent(studentId: string): Promise<Student | null>;
}
