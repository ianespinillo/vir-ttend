import { EntityManager } from '@mikro-orm/core';
import { Subject } from '../../../domain/entities/subject.entity';
import { SubjectTeacherAssignment } from '../../../domain/value-objects/subject-teacher-assignment.vo';
import { CourseOrmEntity } from '../entities/courses.orm-entity';
import { SubjectTeacherOrmEntity } from '../entities/subject-teacher.orm-entity';
import { SubjectOrmEntity } from '../entities/subject.orm-entity';

export class SubjectMapper {
	static toOrm(entity: Subject, em: EntityManager): SubjectOrmEntity {
		const ormEntity = new SubjectOrmEntity();
		ormEntity.id = entity.id.getRaw();
		ormEntity.name = entity.name;
		ormEntity.area = entity.area;
		ormEntity.weeklyHours = entity.weeklyHours;
		ormEntity.kind = entity.kind;
		ormEntity.courseId = entity.courseId;
		ormEntity.course = em.getReference(CourseOrmEntity, entity.courseId);
		ormEntity.deletedAt = entity.deletedAt ?? null;
		return ormEntity;
	}
	/** Rows of the subject teacher assignments, owned by the given subject ORM entity. */
	static teachersToOrm(
		entity: Subject,
		subject: SubjectOrmEntity,
	): SubjectTeacherOrmEntity[] {
		return entity.teachers.map((assignment) =>
			SubjectMapper.teacherToOrm(assignment, subject),
		);
	}
	static teacherToOrm(
		assignment: SubjectTeacherAssignment,
		subject: SubjectOrmEntity,
	): SubjectTeacherOrmEntity {
		const orm = new SubjectTeacherOrmEntity();
		orm.subject = subject;
		SubjectMapper.copyTeacher(assignment, orm);
		return orm;
	}
	static copyTeacher(
		assignment: SubjectTeacherAssignment,
		orm: SubjectTeacherOrmEntity,
	): void {
		orm.commissionNumber = assignment.commissionNumber;
		orm.teacherId = assignment.teacherId ?? null;
		orm.teacherName = assignment.teacherName ?? null;
	}
	/** The assignments collection must be initialized (populate 'teachers'). */
	static toDomain(ormEntity: SubjectOrmEntity): Subject {
		return Subject.reconstitute({
			id: ormEntity.id,
			courseId: ormEntity.courseId,
			teachers: ormEntity.teachers.getItems().map((t) => ({
				commissionNumber: t.commissionNumber,
				teacherId: t.teacherId ?? undefined,
				teacherName: t.teacherName ?? undefined,
			})),
			name: ormEntity.name,
			area: ormEntity.area,
			weeklyHours: ormEntity.weeklyHours,
			kind: ormEntity.kind,
			createdAt: ormEntity.createdAt,
			updatedAt: ormEntity.updatedAt,
			deletedAt: ormEntity.deletedAt ?? undefined,
		});
	}
}
