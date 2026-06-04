import { EntityRepository } from '@mikro-orm/postgresql';
import { PaginatedResponse } from '@repo/common';
import { Student } from '../../../domain/entities/student.entity';
import {
	IStudentRepository,
	SearchStudentFilters,
} from '../../../domain/repositories/student.repository.interface';
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
		const orm = StudentMapper.toOrm(student);
		this.em.persist(orm);
		await this.em.flush();
	}

	async search(
		filters: SearchStudentFilters,
	): Promise<PaginatedResponse<Student>> {
		const qb = this.em.createQueryBuilder(StudentOrmEntity, 's');

		qb.where({ tenantId: filters.tenantId });

		if (filters.query) {
			qb.andWhere({
				$or: [
					{ firstName: { $ilike: `%${filters.query}%` } },
					{ lastName: { $ilike: `%${filters.query}%` } },
					{ documentNumber: { $ilike: `%${filters.query}%` } },
				],
			});
		}

		if (filters.courseId) {
			qb.andWhere({ courseId: filters.courseId });
		}

		if (filters.status) {
			qb.andWhere({ status: filters.status });
		}

		qb.orderBy({ lastName: 'ASC', firstName: 'ASC' });

		const [items, total] = await qb
			.limit(filters.limit)
			.offset((filters.page - 1) * filters.limit)
			.getResultAndCount();

		return {
			items: items.map(StudentMapper.toDomain),
			total,
			page: filters.page,
			limit: filters.limit,
			totalPages: Math.round(total / filters.limit),
		};
	}
}
