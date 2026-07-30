import { Injectable } from '@nestjs/common';
import { CourseRepository } from '../../../academic/infrastructure/persistence/repositories/course.repository';
import { Course } from '../../domain/entities/course.entity';
import { ICoursePort } from '../../domain/ports/course.port.interface';

@Injectable()
export class CourseAdapter implements ICoursePort {
	constructor(private readonly courseRepo: CourseRepository) {}
	async findById(id: string): Promise<Course | null> {
		const course = await this.courseRepo.findById(id);
		if (!course) return null;
		return Course.reconstitute({
			id: course.id.getRaw(),
			academicYearId: course.academicYearId,
			tenantId: course.tenantId,
			name: `${course.yearNumber}° ${course.division}°`,
			level: course.level,
		});
	}
}
