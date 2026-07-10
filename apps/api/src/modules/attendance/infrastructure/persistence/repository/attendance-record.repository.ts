import { EntityRepository } from '@mikro-orm/postgresql';
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
		const orms = await this.find({
			courseId,
			date,
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
		const result = await this.em
			.createQueryBuilder(AttendanceRecordOrmEntity, 'ar')
			.select([
				'ar.course_id as courseId',
				'COUNT(ar.id) as totalStudents',
				`COUNT(ar.id) FILTER (WHERE ar.status = 'PRESENT') as presents`,
				`COUNT(ar.id) FILTER (WHERE ar.status = 'ABSENT') as absents`,
				`COUNT(ar.id) FILTER (WHERE ar.status = 'LATE') as late`,
				`COUNT(ar.id) FILTER (WHERE ar.status = 'JUSTIFIED') as justified`,
			])
			.where({
				courseId: courseId,
				date: targetDate,
			})
			.execute();

		return result as unknown as RawCourseMetrics;
	}
	async getCourseSummaryForDateRange(
		courseId: string,
		from: Date,
		to: Date,
	): Promise<RawCourseMetrics> {
		const result = await this.em
			.qb(AttendanceRecordOrmEntity, 'ar')
			.select([
				'ar.course_id as courseId',
				'COUNT(ar.id) as totalStudents',
				`COUNT(ar.id) FILTER (WHERE ar.status = 'PRESENT') as presents`,
				`COUNT(ar.id) FILTER (WHERE ar.status = 'ABSENT') as absents`,
				`COUNT(ar.id) FILTER (WHERE ar.status = 'LATE') as late`,
				`COUNT(ar.id) FILTER (WHERE ar.status = 'JUSTIFIED') as justified`,
			])
			.where({
				courseId: courseId,
				date: {
					$gt: from,
					$lt: to,
				},
			})
			.execute();
		return result as unknown as RawCourseMetrics;
	}
}
