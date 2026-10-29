import { EntityManager } from '@mikro-orm/postgresql';
import { MockProxy, mock } from 'jest-mock-extended';
import { WorkshopSessionNotHeld } from '../../../src/modules/attendance/domain/entities/workshop-session-not-held.entity';
import { WorkshopAttendanceRecordOrmEntity } from '../../../src/modules/attendance/infrastructure/persistence/entities/workshop-attendance-record.orm-entity';
import { WorkshopSessionNotHeldOrmEntity } from '../../../src/modules/attendance/infrastructure/persistence/entities/workshop-session-not-held.orm-entity';
import { WorkshopAttendanceRecordRepository } from '../../../src/modules/attendance/infrastructure/persistence/repository/workshop-attendance-record.repository';
import { WorkshopSessionNotHeldRepository } from '../../../src/modules/attendance/infrastructure/persistence/repository/workshop-session-not-held.repository';

describe('WorkshopSessionNotHeldRepository', () => {
	let em: MockProxy<EntityManager>;
	let repository: WorkshopSessionNotHeldRepository;

	const day = new Date('2026-07-06T00:00:00Z');
	const marker = (reason?: string) =>
		WorkshopSessionNotHeld.reconstitute({
			id: 'marker-1',
			tenantId: 'tenant-id',
			workshopCommissionId: 'commission-1',
			date: day,
			reason,
			createdBy: 'user-id',
			createdAt: new Date('2026-07-06T08:00:00Z'),
		});
	const orm = (reason?: string | null) => {
		const entity = new WorkshopSessionNotHeldOrmEntity();
		entity.id = 'marker-1';
		entity.tenantId = 'tenant-id';
		entity.workshopCommissionId = 'commission-1';
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
		repository = new WorkshopSessionNotHeldRepository(
			em,
			WorkshopSessionNotHeldOrmEntity,
		);
	});

	it('finds a marker by commission and the YYYY-MM-DD key of the date', async () => {
		em.findOne.mockResolvedValue(orm('Paro'));

		const found = await repository.findByCommissionAndDate('commission-1', day);

		expect(em.findOne.mock.calls[0][1]).toEqual({
			workshopCommissionId: 'commission-1',
			date: '2026-07-06',
		});
		expect(found?.reason).toBe('Paro');
	});

	it('answers null when the day has no marker', async () => {
		expect(
			await repository.findByCommissionAndDate('commission-1', day),
		).toBeNull();
	});

	it('finds the markers of a commission in a date range', async () => {
		const to = new Date('2026-07-31T00:00:00Z');
		em.find.mockResolvedValue([orm()]);

		const found = await repository.findByCommissionAndDateRange(
			'commission-1',
			day,
			to,
		);

		expect(em.find.mock.calls[0][1]).toEqual({
			workshopCommissionId: 'commission-1',
			date: { $gte: day, $lte: to },
		});
		expect(found).toHaveLength(1);
	});

	it('finds the markers of several commissions in one query', async () => {
		const to = new Date('2026-07-31T00:00:00Z');
		em.find.mockResolvedValue([orm()]);

		await repository.findByCommissionIdsAndDateRange(['c1', 'c2'], day, to);

		expect(em.find).toHaveBeenCalledTimes(1);
		expect(em.find.mock.calls[0][1]).toEqual({
			workshopCommissionId: { $in: ['c1', 'c2'] },
			date: { $gte: day, $lte: to },
		});
	});

	it('does not query when no commission is given', async () => {
		expect(
			await repository.findByCommissionIdsAndDateRange([], day, day),
		).toEqual([]);
		expect(em.find).not.toHaveBeenCalled();
	});

	it('deletes by commission and the YYYY-MM-DD key of the date', async () => {
		await repository.delete('commission-1', day);

		expect(em.nativeDelete.mock.calls[0][1]).toEqual({
			workshopCommissionId: 'commission-1',
			date: '2026-07-06',
		});
	});

	describe('save', () => {
		it('persists a new marker', async () => {
			await repository.save(marker('Paro'));

			expect(em.persist).toHaveBeenCalledTimes(1);
			const persisted = em.persist.mock
				.calls[0][0] as WorkshopSessionNotHeldOrmEntity;
			expect(persisted.reason).toBe('Paro');
			expect(em.flush).toHaveBeenCalledTimes(1);
		});

		it('updates the reason of an existing marker', async () => {
			const existing = orm('Viejo');
			em.findOne.mockResolvedValue(existing);

			await repository.save(marker('Nuevo'));

			expect(existing.reason).toBe('Nuevo');
			expect(em.persist).not.toHaveBeenCalled();
		});

		it('writes a cleared reason as null so the column is emptied', async () => {
			const existing = orm('Viejo');
			em.findOne.mockResolvedValue(existing);

			await repository.save(marker(undefined));

			expect(existing.reason).toBeNull();
		});
	});
});

describe('WorkshopAttendanceRecordRepository.deleteByCommissionAndDate', () => {
	it('deletes the commission records of the YYYY-MM-DD key and returns the count', async () => {
		const em = mock<EntityManager>();
		em.nativeDelete.mockResolvedValue(3);
		const repository = new WorkshopAttendanceRecordRepository(
			em,
			WorkshopAttendanceRecordOrmEntity,
		);

		const deleted = await repository.deleteByCommissionAndDate(
			'commission-1',
			new Date('2026-07-06T00:00:00Z'),
		);

		expect(deleted).toBe(3);
		expect(em.nativeDelete.mock.calls[0][1]).toEqual({
			workshopCommissionId: 'commission-1',
			date: '2026-07-06',
		});
	});
});
