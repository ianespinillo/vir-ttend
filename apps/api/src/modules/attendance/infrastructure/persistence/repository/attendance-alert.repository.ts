import { EntityRepository, FilterQuery } from '@mikro-orm/postgresql';
import { PaginatedResponse } from '@repo/common';
import { AttendanceAlert } from '../../../domain/entities/attendance-alert.entity';
import { IAttendanceAlertRepository } from '../../../domain/repositories/attendance-alert.repository.interface';
import { AttendanceAlertOrmEntity } from '../entities/attendance-alert.orm-entity';
import { AttendanceAlertMapper } from '../mappers/attendance-alert.mapper';

export class AttendanceAlertRepository
	extends EntityRepository<AttendanceAlertOrmEntity>
	implements IAttendanceAlertRepository
{
	async countUnSeen(coursesId?: string[], tenantId?: string): Promise<number> {
		const where: FilterQuery<AttendanceAlertOrmEntity> = {
			seenAt: null,
		};
		if (coursesId && coursesId.length > 0) {
			where.courseId = { $in: coursesId };
			if (tenantId) where.tenantId = tenantId;
		} else if (tenantId) {
			where.tenantId = tenantId;
		} else {
			return 0;
		}
		return this.count(where);
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
		tenantId?: string,
	): Promise<PaginatedResponse<AttendanceAlert>> {
		const perPage = pageOptions.perPage ?? 10;
		const qb = this.createQueryBuilder();

		if (tenantId && (!courseId || courseId.length === 0)) {
			qb.andWhere({ tenantId });
		} else if (courseId && courseId.length > 0) {
			qb.andWhere({ courseId: { $in: courseId } });
			if (tenantId) {
				qb.andWhere({ tenantId });
			}
		} else {
			return {
				items: [],
				total: 0,
				totalPages: 0,
				page: pageOptions.page,
				limit: perPage,
			};
		}

		if (type) {
			qb.andWhere({ alertType: type });
		}

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

	async findUnSeen(
		coursesId?: string[],
		tenantId?: string,
	): Promise<AttendanceAlert[]> {
		const where: FilterQuery<AttendanceAlertOrmEntity> = {
			seenAt: null,
		};
		if (coursesId && coursesId.length > 0) {
			where.courseId = { $in: coursesId };
			if (tenantId) where.tenantId = tenantId;
		} else if (tenantId) {
			where.tenantId = tenantId;
		} else {
			return [];
		}
		const orm = await this.find(where, {
			orderBy: { createdAt: 'DESC' },
		});
		return orm.map(AttendanceAlertMapper.toDomain);
	}

	async save(alert: AttendanceAlert): Promise<void> {
		this.em.persist(AttendanceAlertMapper.toOrm(alert));
		await this.em.flush();
	}
}
