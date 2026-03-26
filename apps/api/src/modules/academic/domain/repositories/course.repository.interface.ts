import { LevelType, ShiftType } from '@repo/common';
import { Course } from '../entities/course.entity';

export interface ICourseRepository {
	findById(id: string): Promise<Course | null>;
	findByAcademicYear(
		academicYearId: string,
		where?: { level?: LevelType; preceptorId?: string },
	): Promise<Course[]>;
	findByAcademicYearAndDivision(
		academicYearId: string,
		year: number,
		division: string,
		shift: ShiftType,
	): Promise<Course | null>;
	findByPreceptor(preceptorId: string): Promise<Course[]>;
	save(course: Course): Promise<void>;
}
