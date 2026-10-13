import { EntityRepository } from '@mikro-orm/postgresql';
import { Subject } from '../../../domain/entities/subject.entity';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { CourseOrmEntity } from '../entities/courses.orm-entity';
import { SubjectOrmEntity } from '../entities/subject.orm-entity';
import { SubjectMapper } from '../mappers/subject.mapper';

export class SubjectRepository
	extends EntityRepository<SubjectOrmEntity>
	implements ISubjectRepository
{
	async findByTeacherAndCourses(
		teacherId: string,
		courses: string[],
	): Promise<Subject[]> {
		const orms = await this.find({
			teacherId,
			courseId: { $in: courses },
			deletedAt: null,
		});
		return orms.map((o) => SubjectMapper.toDomain(o));
	}
	async findById(id: string): Promise<Subject | null> {
		const orm = await this.findOne({ id });
		if (!orm) {
			return null;
		}
		return SubjectMapper.toDomain(orm);
	}
	async findByTeacher(teacherId: string): Promise<Subject[]> {
		const orms = await this.find({ teacherId, deletedAt: null });
		return orms.map((orm) => SubjectMapper.toDomain(orm));
	}
	async findByCourse(courseId: string): Promise<Subject[]> {
		const orms = await this.find({ courseId, deletedAt: null });
		return orms.map((orm) => SubjectMapper.toDomain(orm));
	}
	async findByCourses(courses: string[]): Promise<Subject[]> {
		const orms = await this.find({
			courseId: { $in: courses },
			deletedAt: null,
		});
		return orms.map((orm) => SubjectMapper.toDomain(orm));
	}
	async save(subject: Subject): Promise<void> {
		const existing = await this.findOne({ id: subject.id.getRaw() });
		if (existing) {
			existing.courseId = subject.courseId;
			if (subject.courseId) {
				existing.course = this.em.getReference(CourseOrmEntity, subject.courseId);
			}
			existing.teacherId = subject.teacherId;
			existing.name = subject.name;
			existing.area = subject.area;
			existing.weeklyHours = subject.weeklyHours;
			existing.updatedAt = subject.updatedAt;
			existing.deletedAt = subject.deletedAt ?? null;
		} else {
			const orm = SubjectMapper.toOrm(subject, this.em);
			this.em.persist(orm);
		}
		await this.em.flush();
	}
}
