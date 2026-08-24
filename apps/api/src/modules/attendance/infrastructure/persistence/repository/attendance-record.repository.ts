import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../../shared/cache/cache.module';
import { AttendanceRecord } from '../../../domain/entities/attendance-record.entity';
import {
	IAttendanceRecordRepository,
	RawCourseMetrics,
} from '../../../domain/repositories/attendance-record.repository.interface';
import { AttendanceRecordOrmEntity } from '../entities/attendance-record.orm-entity';
import { AttendanceRecordMapper } from '../mappers/attendance-record.mapper';

export class AttendanceRecordRepository
	extends EntityRepository<AttendanceRecordOrmEntity>
	implements IAttendanceRecordRepository
{
	constructor(
		em: EntityManager,
		@Inject(REDIS_CLIENT) private readonly redis: Redis,
	) {
		super(em, AttendanceRecordOrmEntity);
	}
	async findBySubjectAndDateRange(
		subjectId: string,
		from: Date,
		to: Date,
	): Promise<AttendanceRecord[]> {
		const orms = await this.find({
			subjectId,
			date: {
				$gt: from,
				$lt: to,
			},
		});
		return orms.map((o) => AttendanceRecordMapper.toDomain(o));
	}
	async findBySubjectAndDate(
		subjectId: string,
		date: Date,
	): Promise<AttendanceRecord[]> {
		const orms = await this.find({
			subjectId,
			date,
		});
		if (orms.length === 0) return [];
		return orms.map((o) => AttendanceRecordMapper.toDomain(o));
	}
	async findBySubject(subjectId: string): Promise<AttendanceRecord[]> {
		const orms = await this.find({ subjectId });
		return orms.map((o) => AttendanceRecordMapper.toDomain(o));
	}

	async findRecordsOfLastSubjectClass(
		subjectId: string,
		beforeDate: Date,
	): Promise<AttendanceRecord[]> {
		const orms = await this.find({
			subjectId,
			date: {
				$gt: beforeDate,
			},
		});
		return orms.map((o) => AttendanceRecordMapper.toDomain(o));
	}
	async bulkSave(records: AttendanceRecord[]): Promise<void> {
		for (const record of records) {
			this.em.persist(AttendanceRecordMapper.toOrm(record));
		}
		await this.em.flush();
	}

	async findByCourseAndDate(
		courseId: string,
		date: Date,
	): Promise<AttendanceRecord[]> {
		console.log(
			'findByCourseAndDate',
			courseId,
			date.toISOString().split('T')[0],
		);
		const orms = await this.find({
			courseId,
			date: date.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
		});
		if (!orms) return [];
		return orms.map((o) => AttendanceRecordMapper.toDomain(o));
	}

	async findByCourseAndRange(
		courseId: string,
		from: Date,
		to: Date,
	): Promise<AttendanceRecord[]> {
		const orms = await this.find({
			courseId,
			date: {
				$gt: from,
				$lt: to,
			},
		});
		if (!orms) return [];
		return orms.map((o) => AttendanceRecordMapper.toDomain(o));
	}

	async findByDateRange(from: Date, to: Date): Promise<AttendanceRecord[]> {
		const orms = await this.find({
			date: {
				$gt: from,
				$lt: to,
			},
		});
		if (!orms) return [];
		return orms.map((o) => AttendanceRecordMapper.toDomain(o));
	}

	async findById(id: string): Promise<AttendanceRecord | null> {
		const orm = await this.findOne(id);
		if (!orm) return null;
		return AttendanceRecordMapper.toDomain(orm);
	}

	async findByStudentAndCourseAndDate(
		courseId: string,
		studentId: string,
		date: Date,
	): Promise<AttendanceRecord | null> {
		const orm = await this.findOne({
			courseId,
			studentId,
			date,
		});
		if (!orm) return null;
		return AttendanceRecordMapper.toDomain(orm);
	}

	async findByStudentAndDateRange(
		id: string,
		from: Date,
		to: Date,
	): Promise<AttendanceRecord[]> {
		const orms = await this.find({
			studentId: id,
			date: {
				$gt: from,
				$lt: to,
			},
		});
		if (!orms) return [];
		return orms.map((o) => AttendanceRecordMapper.toDomain(o));
	}

	async save(record: AttendanceRecord): Promise<void> {
		this.em.persist(AttendanceRecordMapper.toOrm(record));
		await this.em.flush();
	}
	async getCourseSummaryForDate(
		courseId: string,
		targetDate: Date,
	): Promise<RawCourseMetrics> {
		const cacheKey = `attendance:summary:${courseId}:${targetDate
			.toISOString()
			.slice(0, 10)}`;
		try {
			const cached = await this.redis.get(cacheKey);
			if (cached) {
				return JSON.parse(cached) as unknown as RawCourseMetrics;
			}
		} catch {
			// redis no disponible: cae a base de datos
		}

		const rows = await this.em.getConnection().execute(
			`SELECT
            ar.course_id as "courseId",
            COUNT(DISTINCT ar.student_id) as "totalStudents",
            COUNT(ar.id) FILTER (WHERE ar.status = 'present') as "presents",
            COUNT(ar.id) FILTER (WHERE ar.status = 'absent') as "absents",
            COUNT(ar.id) FILTER (WHERE ar.status = 'late') as "late",
            COUNT(ar.id) FILTER (WHERE ar.status = 'justified') as "justified"
        FROM "attendanceRecord" ar
        WHERE ar.course_id = ?
          AND ar.date = ?
        GROUP BY ar.course_id`,
			[courseId, targetDate.toISOString().split('T')[0]],
		);
		const row = Array.isArray(rows) ? rows[0] : rows;
		const rawRes = (row ?? {
			courseId,
			totalStudents: '0',
			presents: '0',
			absents: '0',
			late: '0',
			justified: '0',
		}) as RawCourseMetrics;
		try {
			row && (await this.redis.set(cacheKey, JSON.stringify(rawRes), 'EX', 300));
		} catch {
			// cache best-effort
		}
		return rawRes;
	}
	async getCourseSummaryForDateRange(
		courseId: string,
		from: Date,
		to: Date,
	): Promise<RawCourseMetrics> {
		const rows = await this.em.getConnection().execute(
			`SELECT
            ar.course_id as "courseId",
            COUNT(DISTINCT ar.student_id) as "totalStudents",
            COUNT(ar.id) FILTER (WHERE ar.status = 'present') as "presents",
            COUNT(ar.id) FILTER (WHERE ar.status = 'absent') as "absents",
            COUNT(ar.id) FILTER (WHERE ar.status = 'late') as "late",
            COUNT(ar.id) FILTER (WHERE ar.status = 'justified') as "justified"
        FROM "attendanceRecord" ar
        WHERE ar.course_id = ?
          AND ar.date BETWEEN ? AND ?
        GROUP BY ar.course_id`,
			[courseId, from.toISOString().split('T')[0], to.toISOString().split('T')[0]],
		);
		const row = Array.isArray(rows) ? rows[0] : rows;
		return (row ?? {
			courseId,
			totalStudents: 0,
			presents: 0,
			absents: 0,
			late: 0,
			justified: 0,
		}) as RawCourseMetrics;
	}
}
