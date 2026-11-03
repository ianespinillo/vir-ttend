import { Collection, EntityManager } from '@mikro-orm/core';
import { SUBJECT_KIND } from '@repo/common';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';
import { CourseOrmEntity } from '../../../../src/modules/academic/infrastructure/persistence/entities/courses.orm-entity';
import { SubjectTeacherOrmEntity } from '../../../../src/modules/academic/infrastructure/persistence/entities/subject-teacher.orm-entity';
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
		expect(
			SubjectMapper.teachersToOrm(domain, orm).map((t) => t.teacherId),
		).toEqual(['teacher-uuid-1']);
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

	it('maps the manual teacher name both ways', () => {
		const domain = Subject.create({
			courseId: 'course-uuid-1',
			teacherName: 'Laura Gómez',
			name: 'Historia',
			area: 'Sociales',
			weeklyHours: 3,
		});
		const em = {
			getReference: jest.fn((_entity: unknown, id: string) => ({ id })),
		} as unknown as EntityManager;

		const orm = SubjectMapper.toOrm(domain, em);

		const [row] = SubjectMapper.teachersToOrm(domain, orm);
		expect(row.teacherId).toBeNull();
		expect(row.teacherName).toBe('Laura Gómez');
		expect(row.commissionNumber).toBeNull();
		orm.teachers = new Collection<SubjectTeacherOrmEntity>(orm, [row]);
		expect(SubjectMapper.toDomain(orm).teacherName).toBe('Laura Gómez');
	});

	it('maps one teacher per commission both ways', () => {
		const domain = Subject.create({
			courseId: 'course-uuid-1',
			kind: SUBJECT_KIND.WORKSHOP,
			teachers: [
				{ commissionNumber: 1, teacherId: 'teacher-a' },
				{ commissionNumber: 2, teacherName: 'Laura Gómez' },
			],
			name: 'Carpintería',
			area: 'Taller',
			weeklyHours: 4,
		});
		const em = {
			getReference: jest.fn((_entity: unknown, id: string) => ({ id })),
		} as unknown as EntityManager;

		const orm = SubjectMapper.toOrm(domain, em);

		const rows = SubjectMapper.teachersToOrm(domain, orm);
		expect(rows.map((t) => [t.commissionNumber, t.teacherId])).toEqual([
			[1, 'teacher-a'],
			[2, null],
		]);
		orm.teachers = new Collection<SubjectTeacherOrmEntity>(orm, rows);
		expect(SubjectMapper.toDomain(orm).teachers).toEqual(domain.teachers);
	});
});
