import { EntityManager } from '@mikro-orm/postgresql';
import Redis from 'ioredis';
import { MockProxy, mock } from 'jest-mock-extended';
import { AttendanceRecord } from '../../../src/modules/attendance/domain/entities/attendance-record.entity';
import { AfterCommitQueue } from '../../../src/modules/attendance/infrastructure/persistence/after-commit.queue';
import { AttendanceRecordRepository } from '../../../src/modules/attendance/infrastructure/persistence/repository/attendance-record.repository';

describe('AttendanceRecordRepository', () => {
	let em: MockProxy<EntityManager>;
	let redis: MockProxy<Redis>;
	let afterCommit: AfterCommitQueue;
	let repository: AttendanceRecordRepository;

	const record = (courseId: string, date: string) =>
		AttendanceRecord.reconstitute({
			id: `record-${courseId}-${date}`,
			tenantId: 'tenant-id',
			studentId: 'student-1',
			courseId,
			date: new Date(`${date}T00:00:00Z`),
			status: 'present',
			editedBy: 'user-id',
			editedAt: new Date('2026-07-06T08:00:00Z'),
			createdAt: new Date('2026-07-06T08:00:00Z'),
		});

	beforeEach(() => {
		em = mock<EntityManager>();
		em.find.mockResolvedValue([]);
		em.findOne.mockResolvedValue(null);
		redis = mock<Redis>();
		afterCommit = new AfterCommitQueue();
		repository = new AttendanceRecordRepository(em, redis, afterCommit);
	});

	it('findDailyByCourseAndDate only matches records without a subject', async () => {
		await repository.findDailyByCourseAndDate(
			'course-1',
			new Date('2026-07-06T00:00:00Z'),
		);

		expect(em.find.mock.calls[0][1]).toEqual({
			courseId: 'course-1',
			subjectId: null,
			date: '2026-07-06',
		});
	});

	describe('bulkSave cache invalidation', () => {
		const records = [
			record('course-1', '2026-07-06'),
			record('course-1', '2026-07-06'),
			record('course-2', '2026-07-07'),
		];

		it('invalidates each affected summary once when used outside a unit of work', async () => {
			await repository.bulkSave(records);

			expect(redis.del).toHaveBeenCalledTimes(2);
			expect(redis.del).toHaveBeenCalledWith(
				'attendance:summary:course-1:2026-07-06',
			);
			expect(redis.del).toHaveBeenCalledWith(
				'attendance:summary:course-2:2026-07-07',
			);
		});

		it('invalidates only after the surrounding transaction committed', async () => {
			const order: string[] = [];
			redis.del.mockImplementation(async () => {
				order.push('invalidate');
				return 1;
			});

			await afterCommit.run(async () => {
				await repository.bulkSave(records);
				order.push('commit');
			});

			expect(order).toEqual(['commit', 'invalidate', 'invalidate']);
		});

		it('does not invalidate when the transaction fails', async () => {
			await expect(
				afterCommit.run(async () => {
					await repository.bulkSave(records);
					throw new Error('rollback');
				}),
			).rejects.toThrow('rollback');

			expect(redis.del).not.toHaveBeenCalled();
		});

		it('ignores cache errors', async () => {
			redis.del.mockRejectedValue(new Error('redis down'));

			await expect(repository.bulkSave(records)).resolves.toBeUndefined();
		});
	});
});
