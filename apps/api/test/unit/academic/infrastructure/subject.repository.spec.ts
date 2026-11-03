import { Collection } from '@mikro-orm/core';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { CommissionNumber, SUBJECT_KIND } from '@repo/common';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';
import { SubjectTeacherAssignment } from '../../../../src/modules/academic/domain/value-objects/subject-teacher-assignment.vo';
import { SubjectTeacherOrmEntity } from '../../../../src/modules/academic/infrastructure/persistence/entities/subject-teacher.orm-entity';
import { SubjectOrmEntity } from '../../../../src/modules/academic/infrastructure/persistence/entities/subject.orm-entity';
import { SubjectRepository } from '../../../../src/modules/academic/infrastructure/persistence/repositories/subject.repository';

const WITH_TEACHERS = { populate: ['teachers'], strategy: 'select-in' };

function teacherRow(
	subject: SubjectOrmEntity,
	commissionNumber: CommissionNumber | null,
	teacherId: string,
) {
	return Object.assign(new SubjectTeacherOrmEntity(), {
		id: `row-${commissionNumber ?? 0}`,
		subject,
		commissionNumber,
		teacherId,
	});
}

function ormSubject(rows: Array<[CommissionNumber | null, string]>) {
	const orm = Object.assign(new SubjectOrmEntity(), {
		id: 'subject-1',
		courseId: 'course-1',
		name: 'Carpintería',
		area: 'Taller',
		weeklyHours: 4,
		kind: SUBJECT_KIND.WORKSHOP,
		createdAt: new Date('2026-01-01T00:00:00.000Z'),
		updatedAt: new Date('2026-01-02T00:00:00.000Z'),
	});
	orm.teachers = new Collection<SubjectTeacherOrmEntity>(
		orm,
		rows.map(([n, id]) => teacherRow(orm, n, id)),
	);
	return orm;
}

function domainSubject(teachers: SubjectTeacherAssignment[]) {
	return Subject.reconstitute({
		id: 'subject-1',
		courseId: 'course-1',
		name: 'Carpintería',
		area: 'Taller',
		weeklyHours: 4,
		kind: SUBJECT_KIND.WORKSHOP,
		teachers,
		createdAt: new Date('2026-01-01T00:00:00.000Z'),
		updatedAt: new Date('2026-01-03T00:00:00.000Z'),
	});
}

// subject.repository.spec.ts
describe('SubjectRepository', () => {
	let em: {
		find: jest.Mock;
		findOne: jest.Mock;
		flush: jest.Mock;
		getReference: jest.Mock;
		persist: jest.Mock;
		remove: jest.Mock;
	};
	let repository: SubjectRepository;

	beforeEach(() => {
		em = {
			find: jest.fn().mockResolvedValue([]),
			findOne: jest.fn().mockResolvedValue(null),
			flush: jest.fn().mockResolvedValue(undefined),
			getReference: jest.fn(),
			persist: jest.fn(),
			remove: jest.fn(),
		};
		repository = new SubjectRepository(
			em as unknown as SqlEntityManager,
			SubjectOrmEntity,
		);
	});

	it('findByCourse excluye las materias eliminadas lógicamente y carga los docentes', async () => {
		await repository.findByCourse('course-1');

		expect(em.find.mock.calls[0][1]).toEqual({
			courseId: 'course-1',
			deletedAt: null,
		});
		expect(em.find.mock.calls[0][2]).toEqual(WITH_TEACHERS);
	});

	it('findByTeacher busca por las asignaciones y excluye las materias eliminadas', async () => {
		await repository.findByTeacher('teacher-1');

		expect(em.find.mock.calls[0][1]).toEqual({
			teachers: { teacherId: 'teacher-1' },
			deletedAt: null,
		});
		expect(em.find.mock.calls[0][2]).toEqual(WITH_TEACHERS);
	});

	it('findByTeacherAndCourses busca por las asignaciones y excluye las materias eliminadas', async () => {
		await repository.findByTeacherAndCourses('teacher-1', ['course-1']);

		expect(em.find.mock.calls[0][1]).toEqual({
			teachers: { teacherId: 'teacher-1' },
			courseId: { $in: ['course-1'] },
			deletedAt: null,
		});
		expect(em.find.mock.calls[0][2]).toEqual(WITH_TEACHERS);
	});

	it('findByCourses excluye las materias eliminadas lógicamente', async () => {
		await repository.findByCourses(['course-1', 'course-2']);

		expect(em.find.mock.calls[0][1]).toEqual({
			courseId: { $in: ['course-1', 'course-2'] },
			deletedAt: null,
		});
		expect(em.find.mock.calls[0][2]).toEqual(WITH_TEACHERS);
	});

	it('findById no filtra por deletedAt y carga los docentes', async () => {
		await repository.findById('subject-1');

		expect(em.findOne.mock.calls[0][1]).toEqual({ id: 'subject-1' });
		expect(em.findOne.mock.calls[0][2]).toEqual(WITH_TEACHERS);
	});

	it('findById reconstruye las asignaciones de docentes', async () => {
		em.findOne.mockResolvedValue(
			ormSubject([
				[2, 'teacher-b'],
				[1, 'teacher-a'],
			]),
		);

		const subject = await repository.findById('subject-1');

		expect(subject?.teachers).toEqual([
			{ commissionNumber: 1, teacherId: 'teacher-a', teacherName: undefined },
			{ commissionNumber: 2, teacherId: 'teacher-b', teacherName: undefined },
		]);
	});

	describe('save', () => {
		it('persiste deletedAt en la rama de actualización', async () => {
			const existing = ormSubject([[null, 'old']]);
			em.findOne.mockResolvedValue(existing);
			const subject = domainSubject([
				{ commissionNumber: null, teacherId: 'old' },
			]);
			subject.softDelete();

			await repository.save(subject);

			expect(existing).toHaveProperty('deletedAt', subject.deletedAt);
			expect(em.flush).toHaveBeenCalledTimes(1);
		});

		it('actualiza en el lugar las asignaciones con la misma comisión', async () => {
			const existing = ormSubject([[1, 'old']]);
			const row = existing.teachers.getItems()[0];
			em.findOne.mockResolvedValue(existing);

			await repository.save(
				domainSubject([{ commissionNumber: 1, teacherId: 'teacher-new' }]),
			);

			expect(existing.teachers.getItems()).toEqual([row]);
			expect(row.teacherId).toBe('teacher-new');
		});

		it('agrega las comisiones nuevas y quita las que ya no están', async () => {
			const existing = ormSubject([[null, 'old']]);
			const dropped = existing.teachers.getItems()[0];
			em.findOne.mockResolvedValue(existing);

			await repository.save(
				domainSubject([
					{ commissionNumber: 1, teacherId: 'teacher-a' },
					{ commissionNumber: 2, teacherName: 'Laura Gómez' },
				]),
			);

			expect(em.remove).toHaveBeenCalledWith(dropped);
			const added = em.persist.mock.calls.map(
				([row]) => row as SubjectTeacherOrmEntity,
			);
			expect(added.map((r) => r.commissionNumber)).toEqual([1, 2]);
			expect(added[0].teacherId).toBe('teacher-a');
			expect(added[1].teacherId).toBeNull();
			expect(added[1].teacherName).toBe('Laura Gómez');
			expect(added.every((r) => r.subject === existing)).toBe(true);
		});

		it('persiste las asignaciones de una materia nueva', async () => {
			await repository.save(
				domainSubject([{ commissionNumber: 2, teacherId: 'teacher-b' }]),
			);

			const [persisted] = em.persist.mock.calls[0] as [
				[SubjectOrmEntity, ...SubjectTeacherOrmEntity[]],
			];
			const [subject, ...rows] = persisted;
			expect(subject.id).toBe('subject-1');
			expect(rows.map((t) => [t.commissionNumber, t.teacherId])).toEqual([
				[2, 'teacher-b'],
			]);
			expect(rows[0].subject).toBe(subject);
		});
	});
});
