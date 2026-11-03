import { EntityRepository } from '@mikro-orm/postgresql';
import { Subject } from '../../../domain/entities/subject.entity';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { CourseOrmEntity } from '../entities/courses.orm-entity';
import { SubjectTeacherOrmEntity } from '../entities/subject-teacher.orm-entity';
import { SubjectOrmEntity } from '../entities/subject.orm-entity';
import { SubjectMapper } from '../mappers/subject.mapper';

/**
 * Every read that maps to the domain loads the teacher assignments. select-in
 * keeps the loaded collection complete even when the query filters by teacher.
 */
const WITH_TEACHERS = {
	populate: ['teachers'],
	strategy: 'select-in',
} as const;

export class SubjectRepository
	extends EntityRepository<SubjectOrmEntity>
	implements ISubjectRepository
{
	async findByTeacherAndCourses(
		teacherId: string,
		courses: string[],
	): Promise<Subject[]> {
		const orms = await this.find(
			{
				teachers: { teacherId },
				courseId: { $in: courses },
				deletedAt: null,
			},
			WITH_TEACHERS,
		);
		return orms.map((o) => SubjectMapper.toDomain(o));
	}
	async findById(id: string): Promise<Subject | null> {
		const orm = await this.findOne({ id }, WITH_TEACHERS);
		if (!orm) {
			return null;
		}
		return SubjectMapper.toDomain(orm);
	}
	async findByTeacher(teacherId: string): Promise<Subject[]> {
		const orms = await this.find(
			{ teachers: { teacherId }, deletedAt: null },
			WITH_TEACHERS,
		);
		return orms.map((orm) => SubjectMapper.toDomain(orm));
	}
	async findByCourse(courseId: string): Promise<Subject[]> {
		const orms = await this.find({ courseId, deletedAt: null }, WITH_TEACHERS);
		return orms.map((orm) => SubjectMapper.toDomain(orm));
	}
	async findByCourses(courses: string[]): Promise<Subject[]> {
		const orms = await this.find(
			{
				courseId: { $in: courses },
				deletedAt: null,
			},
			WITH_TEACHERS,
		);
		return orms.map((orm) => SubjectMapper.toDomain(orm));
	}
	async save(subject: Subject): Promise<void> {
		const existing = await this.findOne(
			{ id: subject.id.getRaw() },
			WITH_TEACHERS,
		);
		if (existing) {
			existing.courseId = subject.courseId;
			if (subject.courseId) {
				existing.course = this.em.getReference(CourseOrmEntity, subject.courseId);
			}
			existing.name = subject.name;
			existing.area = subject.area;
			existing.weeklyHours = subject.weeklyHours;
			existing.kind = subject.kind;
			existing.updatedAt = subject.updatedAt;
			existing.deletedAt = subject.deletedAt ?? null;
			this.syncTeachers(existing, subject);
		} else {
			const orm = SubjectMapper.toOrm(subject, this.em);
			this.em.persist([orm, ...SubjectMapper.teachersToOrm(subject, orm)]);
		}
		await this.em.flush();
	}

	/** Updates assignments in place by commission, adds the new ones and removes the dropped ones. */
	private syncTeachers(existing: SubjectOrmEntity, subject: Subject): void {
		const current = new Map<number, SubjectTeacherOrmEntity>(
			existing.teachers.getItems().map((t) => [t.commissionNumber ?? 0, t]),
		);
		for (const assignment of subject.teachers) {
			const key = assignment.commissionNumber ?? 0;
			const row = current.get(key);
			if (row) {
				SubjectMapper.copyTeacher(assignment, row);
				current.delete(key);
			} else {
				this.em.persist(SubjectMapper.teacherToOrm(assignment, existing));
			}
		}
		for (const dropped of current.values()) {
			this.em.remove(dropped);
		}
	}
}
