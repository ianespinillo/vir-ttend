import { EntityManager } from '@mikro-orm/core';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';
import { CourseOrmEntity } from '../../../../src/modules/academic/infrastructure/persistence/entities/courses.orm-entity';
import { SubjectOrmEntity } from '../../../../src/modules/academic/infrastructure/persistence/entities/subject.orm-entity';
import { SubjectMapper } from '../../../../src/modules/academic/infrastructure/persistence/mappers/subject.mapper';

describe('SubjectMapper', () => {
	it('asigna la relación course con em.getReference en toOrm', () => {
		const courseId = 'course-uuid-1';
		const domain = Subject.create({
			courseId,
			teacherId: 'teacher-uuid-1',
			name: 'Matemática',
			area: 'Exactas',
			weeklyHours: 5,
		});

		const em = {
			getReference: jest.fn((_entity: unknown, id: string) => ({ id })),
		} as unknown as EntityManager;

		const orm = SubjectMapper.toOrm(domain, em);

		expect(orm.courseId).toBe(courseId);
		expect(orm.course).toEqual({ id: courseId });
		expect(orm.teacherId).toBe('teacher-uuid-1');
		expect(em.getReference).toHaveBeenCalledWith(CourseOrmEntity, courseId);
	});

	it('mapea deletedAt de dominio a ORM en toOrm', () => {
		const domain = Subject.create({
			courseId: 'course-uuid-1',
			teacherId: 'teacher-uuid-1',
			name: 'Matemática',
			area: 'Exactas',
			weeklyHours: 5,
		});
		domain.softDelete();

		const em = {
			getReference: jest.fn((_entity: unknown, id: string) => ({ id })),
		} as unknown as EntityManager;

		const orm = SubjectMapper.toOrm(domain, em);

		expect(orm.deletedAt).toEqual(domain.deletedAt);
	});

	it('mapea deletedAt de ORM a dominio en toDomain', () => {
		const deletedAt = new Date('2026-10-09T12:00:00.000Z');
		const orm = Object.assign(new SubjectOrmEntity(), {
			id: 'subject-uuid-1',
			courseId: 'course-uuid-1',
			teacherId: 'teacher-uuid-1',
			name: 'Matemática',
			area: 'Exactas',
			weeklyHours: 5,
			createdAt: new Date('2026-01-01T00:00:00.000Z'),
			updatedAt: new Date('2026-01-02T00:00:00.000Z'),
		});
		orm.deletedAt = deletedAt;

		const domain = SubjectMapper.toDomain(orm);

		expect(domain.deletedAt).toEqual(deletedAt);
	});
});
