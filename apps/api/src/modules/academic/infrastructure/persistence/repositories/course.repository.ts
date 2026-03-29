import { EntityRepository } from '@mikro-orm/core';
import { LevelType, ShiftType } from '@repo/common';
import { Course } from '../../../domain/entities/course.entity';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { CourseOrmEntity } from '../entities/courses.orm-entity';
import { CourseMapper } from '../mappers/course.mapper';

export class CourseRepository
	extends EntityRepository<CourseOrmEntity>
	implements ICourseRepository
{
	async findById(id: string): Promise<Course | null> {
		const orm = await this.findOne({ id });
		if (!orm) {
			return null;
		}
		return CourseMapper.toDomain(orm);
	}
	async findByAcademicYear(
		academicYearId: string,
		where?: { level?: LevelType; preceptorId?: string },
	): Promise<Course[]> {
		const orms = await this.find({ academicYearId, ...where });
		return orms.map((orm) => CourseMapper.toDomain(orm));
	}
	async findByAcademicYearAndDivision(
		academicYearId: string,
		year: number,
		division: string,
		shift: ShiftType,
	) {
		const orm = await this.findOne({
			academicYearId,
			yearNumber: year,
			division,
			shift,
		});
		if (!orm) {
			return null;
		}
		return CourseMapper.toDomain(orm);
	}
	async findByPreceptor(preceptorId: string): Promise<Course[]> {
		const orms = await this.find({ preceptorId });
		return orms.map((orm) => CourseMapper.toDomain(orm));
	}
	save(course: Course): Promise<void> {
		const orm = CourseMapper.toOrm(course);
		this.em.persist(orm);
		return this.em.flush();
	}
}
