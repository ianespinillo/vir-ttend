import { SqlEntityManager } from '@mikro-orm/postgresql';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';
import { SubjectOrmEntity } from '../../../../src/modules/academic/infrastructure/persistence/entities/subject.orm-entity';
import { SubjectRepository } from '../../../../src/modules/academic/infrastructure/persistence/repositories/subject.repository';

// subject.repository.spec.ts
describe('SubjectRepository', () => {
	let em: {
		find: jest.Mock;
		findOne: jest.Mock;
		flush: jest.Mock;
		getReference: jest.Mock;
	};
	let repository: SubjectRepository;

	beforeEach(() => {
		em = {
			find: jest.fn().mockResolvedValue([]),
			findOne: jest.fn().mockResolvedValue(null),
			flush: jest.fn().mockResolvedValue(undefined),
			getReference: jest.fn(),
		};
		repository = new SubjectRepository(
			em as unknown as SqlEntityManager,
			SubjectOrmEntity,
		);
	});

	it('findByCourse excluye las materias eliminadas lógicamente', async () => {
		await repository.findByCourse('course-1');

		expect(em.find.mock.calls[0][1]).toEqual({
			courseId: 'course-1',
			deletedAt: null,
		});
	});

	it('findByTeacher excluye las materias eliminadas lógicamente', async () => {
		await repository.findByTeacher('teacher-1');

		expect(em.find.mock.calls[0][1]).toEqual({
			teacherId: 'teacher-1',
			deletedAt: null,
		});
	});

	it('findByTeacherAndCourses excluye las materias eliminadas lógicamente', async () => {
		await repository.findByTeacherAndCourses('teacher-1', ['course-1']);

		expect(em.find.mock.calls[0][1]).toEqual({
			teacherId: 'teacher-1',
			courseId: { $in: ['course-1'] },
			deletedAt: null,
		});
	});

	it('findByCourses excluye las materias eliminadas lógicamente', async () => {
		await repository.findByCourses(['course-1', 'course-2']);

		expect(em.find.mock.calls[0][1]).toEqual({
			courseId: { $in: ['course-1', 'course-2'] },
			deletedAt: null,
		});
	});

	it('findById no filtra por deletedAt', async () => {
		await repository.findById('subject-1');

		expect(em.findOne.mock.calls[0][1]).toEqual({ id: 'subject-1' });
	});

	it('save persiste deletedAt en la rama de actualización', async () => {
		const existing = Object.assign(new SubjectOrmEntity(), {
			id: 'subject-1',
			courseId: 'course-1',
			teacherId: 'teacher-1',
			name: 'Matemática',
			area: 'Exactas',
			weeklyHours: 5,
			createdAt: new Date('2026-01-01T00:00:00.000Z'),
			updatedAt: new Date('2026-01-02T00:00:00.000Z'),
		});
		em.findOne.mockResolvedValue(existing);

		const subject = Subject.reconstitute({
			id: 'subject-1',
			courseId: 'course-1',
			teacherId: 'teacher-1',
			name: 'Matemática',
			area: 'Exactas',
			weeklyHours: 5,
			createdAt: new Date('2026-01-01T00:00:00.000Z'),
			updatedAt: new Date('2026-01-03T00:00:00.000Z'),
		});
		subject.softDelete();

		await repository.save(subject);

		expect(existing).toHaveProperty('deletedAt', subject.deletedAt);
		expect(em.flush).toHaveBeenCalledTimes(1);
	});
});
