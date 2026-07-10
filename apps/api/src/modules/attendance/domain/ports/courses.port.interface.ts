import { Course } from '../entities/course.entity';

export interface ICoursePort {
	getByAcademicYear(academicYearId: string): Promise<Course[]>;
	findById(courseId: string): Promise<Course | null>;
	findByPreceptorId(preceptorId: string): Promise<Course[]>;
}
