import { Course } from '../entities/course.entity';

export interface ICoursePort {
	findById(id: string): Promise<Course | null>;
}
