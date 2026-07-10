import { Inject, Injectable } from '@nestjs/common';
import { ICourseRepository } from '../../../academic/domain/repositories/course.repository.interface';
import { Course } from '../../domain/entities/course.entity';
import { ICoursePort } from '../../domain/ports/courses.port.interface';

@Injectable()
export class CourseAdapter implements ICoursePort {
	constructor(
		@Inject('ICourseRepository')
		private readonly courseRepository: ICourseRepository,
	) {}
	async getByAcademicYear(academicYearId: string): Promise<Course[]> {
		const courses =
			await this.courseRepository.findByAcademicYear(academicYearId);
		return courses.map((c) =>
			Course.reconstitute(
				c.id.getRaw(),
				`${c.yearNumber}° ${c.division}°`,
				academicYearId,
				c.isActive,
				c.level,
			),
		);
	}
	async findById(courseId: string): Promise<Course | null> {
		const course = await this.courseRepository.findById(courseId);
		if (!course) return null;
		return Course.reconstitute(
			course.id.getRaw(),
			`${course.yearNumber}° ${course.division}°`,
			course.academicYearId,
			course.isActive,
			course.level,
		);
	}
	async findByPreceptorId(preceptorId: string): Promise<Course[]> {
		const courses = await this.courseRepository.findByPreceptor(preceptorId);
		return courses.map((c) =>
			Course.reconstitute(
				c.id.getRaw(),
				`${c.yearNumber}° ${c.division}°`,
				c.academicYearId,
				c.isActive,
				c.level,
			),
		);
	}
}
