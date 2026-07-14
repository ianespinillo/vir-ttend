import { EntityRepository } from '@mikro-orm/postgresql';
import { PaginatedResponse } from '@repo/common';
import { AttendanceAlert } from '../../../domain/entities/attendance-alert.entity';
import { IAttendanceAlertRepository } from '../../../domain/repositories/attendance-alert.repository.interface';
import { AttendanceAlertOrmEntity } from '../entities/attendance-alert.orm-entity';
import { AttendanceAlertMapper } from '../mappers/attendance-alert.mapper';

export class AttendanceAlertRepository
	extends EntityRepository<AttendanceAlertOrmEntity>
	implements IAttendanceAlertRepository
{
	async countUnSeen(coursesId: string[]): Promise<number> {
		const orms = await this.find({
			courseId: { $in: coursesId },
		});
		return orms.length;
	}

	async findById(alertId: string): Promise<AttendanceAlert | null> {
		const orm = await this.findOne({
			id: alertId,
		});
		if (!orm) return null;
		return AttendanceAlertMapper.toDomain(orm);
	}

	async findByPreceptor(
		courseId: string[],
		pageOptions: {
			page: number;
			perPage?: number;
		},
		type?: string,
	): Promise<PaginatedResponse<AttendanceAlert>> {
		const qb = await this.em.createQueryBuilder(AttendanceAlertOrmEntity);
		if (type) qb.andWhere({ alertType: type });
		qb.where({
			courseId: {
				$in: courseId,
			},
		});
		const perPage = pageOptions.perPage ?? 10;
		const [items, total] = await qb
			.orderBy({ createdAt: 'DESC' })
			.limit(perPage)
			.offset((pageOptions.page - 1) * perPage)
			.getResultAndCount();

		return {
			items: items.map(AttendanceAlertMapper.toDomain),
			total,
			totalPages: Math.ceil(total / perPage),
			page: pageOptions.page,
			limit: perPage,
		};
	}

	async findByStudentAndDateRange(
		studentId: string,
		from: Date,
		to: Date,
	): Promise<AttendanceAlert[]> {
		const orm = await this.find({
			studentId: studentId,
			createdAt: {
				$gt: from,
				$lt: to,
			},
		});
		return orm.map(AttendanceAlertMapper.toDomain);
	}

	async findByStudentId(studentId: string): Promise<AttendanceAlert[]> {
		const orm = await this.find({ studentId });
		return orm.map(AttendanceAlertMapper.toDomain);
	}

	async findUnSeen(coursesId: string[]): Promise<AttendanceAlert[]> {
		const orm = await this.find({
			courseId: { $in: coursesId },
		});
		return orm.map(AttendanceAlertMapper.toDomain);
	}

	async save(alert: AttendanceAlert): Promise<void> {
		this.em.persist(AttendanceAlertMapper.toOrm(alert));
		await this.em.flush();
	}
}
