import { FilterQuery } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/postgresql';
import { PaginatedResponse } from '@repo/common';
import { Student } from '../../../domain/entities/student.entity';
import {
	IStudentRepository,
	SearchStudentFilters,
} from '../../../domain/repositories/student.repository.interface';
import { CourseOrmEntity } from '../entities/courses.orm-entity';
import { StudentOrmEntity } from '../entities/student.orm-entity';
import { StudentMapper } from '../mappers/student.mapper';

export class StudentRepository
	extends EntityRepository<StudentOrmEntity>
	implements IStudentRepository
{
	async findByCourse(courseId: string): Promise<Student[]> {
		const orms = await this.findAll({
			where: {
				courseId,
			},
		});
		return orms.map((o) => StudentMapper.toDomain(o));
	}

	async findByDocument(
		documentNumber: string,
		tenantId: string,
	): Promise<Student | null> {
		const orm = await this.findOne({
			documentNumber,
			tenantId,
		});
		if (!orm) return null;
		return StudentMapper.toDomain(orm);
	}

	async findById(id: string): Promise<Student | null> {
		const orm = await this.findOne({ id });
		if (!orm) return null;
		return StudentMapper.toDomain(orm);
	}

	async save(student: Student): Promise<void> {
		const existing = await this.findOne({ id: student.id });
		if (existing) {
			existing.tenantId = student.tenantId;
			existing.courseId = student.courseId;
			if (student.courseId) {
				existing.course = this.em.getReference(CourseOrmEntity, student.courseId);
			}
			existing.firstName = student.firstName;
			existing.lastName = student.lastName;
			existing.documentNumber = student.documentNumber.getValue();
			existing.birthDate = student.birthDate;
			existing.tutorName = student.tutorName;
			existing.tutorPhone = student.tutorPhone;
			existing.tutorEmail = student.tutorEmail;
			existing.status = student.status;
			existing.createdAt = student.createdAt;
			existing.updatedAt = student.updatedAt;
		} else {
			const orm = StudentMapper.toOrm(student, this.em);
			this.em.persist(orm);
		}
		await this.em.flush();
	}

	async search(
		filters: SearchStudentFilters,
	): Promise<PaginatedResponse<Student>> {
		const where: FilterQuery<StudentOrmEntity> = {
			tenantId: filters.tenantId,
		};

		if (filters.query) {
			where.$or = [
				{ firstName: { $ilike: `%${filters.query}%` } },
				{ lastName: { $ilike: `%${filters.query}%` } },
				{ documentNumber: { $ilike: `%${filters.query}%` } },
			];
		}

		if (filters.courseId) {
			where.courseId = filters.courseId;
		}

		if (filters.status) {
			where.status = filters.status;
		}

		const [items, total] = await this.findAndCount(where, {
			orderBy: { lastName: 'ASC', firstName: 'ASC' },
			limit: filters.limit,
			offset: (filters.page - 1) * filters.limit,
		});

		return {
			items: items.map(StudentMapper.toDomain),
			total,
			page: filters.page,
			limit: filters.limit,
			totalPages: Math.ceil(total / filters.limit),
		};
	}
}
