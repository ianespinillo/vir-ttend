import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { LEVEL, LevelType, ShiftType } from '@repo/common';
import { Course } from '../../../domain/entities/course.entity';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { AcademicYearOrmEntity } from '../entities/academic-year.orm-entity';
import { CourseOrmEntity } from '../entities/courses.orm-entity';
import { CourseMapper } from '../mappers/course.mapper';

export class CourseRepository
	extends EntityRepository<CourseOrmEntity>
	implements ICourseRepository
{
	async findBySubjectId(subjectId: string): Promise<Course | null> {
		const orm = await this.findOne({
			subjects: {
				id: subjectId,
			},
		});
		if (!orm) return null;
		return CourseMapper.toDomain(orm);
	}
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
		const filters: FilterQuery<CourseOrmEntity> = {
			academicYear: academicYearId,
		};

		if (where?.level && where.level !== LEVEL.DEFAULT) {
			filters.level = where.level;
		}

		if (where?.preceptorId) {
			filters.preceptorId = where.preceptorId;
		}

		const orms = await this.find(filters);

		return orms.map((orm) => CourseMapper.toDomain(orm));
	}
	async findByAcademicYearAndDivision(
		academicYearId: string,
		year: number,
		division: string,
		shift: ShiftType,
	) {
		const orm = await this.findOne({
			academicYear: academicYearId,
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
	async save(course: Course): Promise<void> {
		const existing = await this.findOne({ id: course.id.getRaw() });
		if (existing) {
			existing.schoolId = course.tenantId;
			existing.academicYearId = course.academicYearId;
			if (course.academicYearId) {
				existing.academicYear = this.em.getReference(
					AcademicYearOrmEntity,
					course.academicYearId,
				);
			}
			existing.preceptorId = course.preceptorId;
			existing.level = course.level;
			existing.isActive = course.isActive;
			existing.yearNumber = course.yearNumber;
			existing.division = course.division;
			existing.shift = course.shift;
			existing.updatedAt = course.updatedAt;
		} else {
			const orm = CourseMapper.toOrm(course, this.em);
			this.em.persist(orm);
		}
		await this.em.flush();
	}
}
