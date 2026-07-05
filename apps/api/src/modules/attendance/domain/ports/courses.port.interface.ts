import { Course } from '../entities/course.entity';

export interface ICoursePort {
	getByAcademicYear(academicYearId: string): Promise<Course[]>;
}
