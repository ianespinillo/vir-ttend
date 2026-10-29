import { EntityManager } from '@mikro-orm/postgresql';
import { MockProxy, mock } from 'jest-mock-extended';
import { DailySessionNotHeld } from '../../../src/modules/attendance/domain/entities/daily-session-not-held.entity';
import { DailySessionNotHeldOrmEntity } from '../../../src/modules/attendance/infrastructure/persistence/entities/daily-session-not-held.orm-entity';
import { DailySessionNotHeldRepository } from '../../../src/modules/attendance/infrastructure/persistence/repository/daily-session-not-held.repository';

describe('DailySessionNotHeldRepository', () => {
	let em: MockProxy<EntityManager>;
	let repository: DailySessionNotHeldRepository;

	const day = new Date('2026-07-06T00:00:00Z');
	const marker = (reason?: string) =>
		DailySessionNotHeld.reconstitute({
			id: 'marker-1',
			tenantId: 'tenant-id',
			courseId: 'course-1',
			date: day,
			reason,
			createdBy: 'user-id',
			createdAt: new Date('2026-07-06T08:00:00Z'),
		});
	const orm = (reason?: string | null) => {
		const entity = new DailySessionNotHeldOrmEntity();
		entity.id = 'marker-1';
		entity.tenantId = 'tenant-id';
		entity.courseId = 'course-1';
		entity.date = day;
		entity.reason = reason;
		entity.createdBy = 'user-id';
		entity.createdAt = new Date('2026-07-06T08:00:00Z');
		return entity;
	};

	beforeEach(() => {
		em = mock<EntityManager>();
		em.find.mockResolvedValue([]);
		em.findOne.mockResolvedValue(null);
		repository = new DailySessionNotHeldRepository(
			em,
			DailySessionNotHeldOrmEntity,
		);
	});

	it('finds a marker by course and the YYYY-MM-DD key of the date', async () => {
		em.findOne.mockResolvedValue(orm('Paro'));

		const found = await repository.findByCourseAndDate('course-1', day);

		expect(em.findOne.mock.calls[0][1]).toEqual({
			courseId: 'course-1',
			date: '2026-07-06',
		});
		expect(found?.reason).toBe('Paro');
	});

	it('answers null when the day has no marker', async () => {
		expect(await repository.findByCourseAndDate('course-1', day)).toBeNull();
	});

	it('finds the markers of a course in a date range', async () => {
		const to = new Date('2026-07-31T00:00:00Z');
		em.find.mockResolvedValue([orm()]);

		const found = await repository.findByCourseAndDateRange('course-1', day, to);

		expect(em.find.mock.calls[0][1]).toEqual({
			courseId: 'course-1',
			date: { $gte: day, $lte: to },
		});
		expect(found).toHaveLength(1);
	});

	it('deletes by course and the YYYY-MM-DD key of the date', async () => {
		await repository.delete('course-1', day);

		expect(em.nativeDelete.mock.calls[0][1]).toEqual({
			courseId: 'course-1',
			date: '2026-07-06',
		});
	});

	describe('save', () => {
		it('persists a new marker', async () => {
			await repository.save(marker('Paro'));

			expect(em.persist).toHaveBeenCalledTimes(1);
			const persisted = em.persist.mock
				.calls[0][0] as DailySessionNotHeldOrmEntity;
			expect(persisted.reason).toBe('Paro');
			expect(em.flush).toHaveBeenCalledTimes(1);
		});

		it('updates the reason of an existing marker', async () => {
			const existing = orm('Viejo');
			em.findOne.mockResolvedValue(existing);

			await repository.save(marker('Nuevo'));

			expect(existing.reason).toBe('Nuevo');
			expect(em.persist).not.toHaveBeenCalled();
			expect(em.flush).toHaveBeenCalledTimes(1);
		});

		it('writes a cleared reason as null so the column is emptied', async () => {
			const existing = orm('Viejo');
			em.findOne.mockResolvedValue(existing);

			await repository.save(marker(undefined));

			expect(existing.reason).toBeNull();
		});
	});
});
