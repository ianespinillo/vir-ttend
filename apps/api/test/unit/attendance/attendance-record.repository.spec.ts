import { EntityManager } from '@mikro-orm/postgresql';
import Redis from 'ioredis';
import { MockProxy, mock } from 'jest-mock-extended';
import { AttendanceRecordRepository } from '../../../src/modules/attendance/infrastructure/persistence/repository/attendance-record.repository';

describe('AttendanceRecordRepository', () => {
	let em: MockProxy<EntityManager>;
	let repository: AttendanceRecordRepository;

	beforeEach(() => {
		em = mock<EntityManager>();
		em.find.mockResolvedValue([]);
		repository = new AttendanceRecordRepository(em, mock<Redis>());
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
});
