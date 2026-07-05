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
			),
		);
	}
}
