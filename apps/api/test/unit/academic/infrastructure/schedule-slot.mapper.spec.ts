import { EntityManager } from '@mikro-orm/core';
import { CommissionNumber, DAYOFWEEK } from '@repo/common';
import { ScheduleSlot } from '../../../../src/modules/academic/domain/entities/schedule-slot.entity';
import { ScheduleSlotOrmEntity } from '../../../../src/modules/academic/infrastructure/persistence/entities/schedule-slot.orm-entity';
import { SubjectOrmEntity } from '../../../../src/modules/academic/infrastructure/persistence/entities/subject.orm-entity';
import { ScheduleSlotMapper } from '../../../../src/modules/academic/infrastructure/persistence/mappers/schedule-slot.mapper';

describe('ScheduleSlotMapper', () => {
	it('asigna los FK subjectId y courseId y la relación subject con em.getReference en toOrm', () => {
		const subjectId = 'subject-uuid-1';
		const courseId = 'course-uuid-1';
		const domain = ScheduleSlot.create({
			subjectId,
			courseId,
			dayOfWeek: DAYOFWEEK.MONDAY,
			startTime: '08:00',
			endTime: '09:00',
		});

		const em = {
			getReference: jest.fn((_entity: unknown, id: string) => ({ id })),
		} as unknown as EntityManager;

		const orm = ScheduleSlotMapper.toOrm(domain, em);

		expect(orm.subjectId).toBe(subjectId);
		expect(orm.courseId).toBe(courseId);
		expect(orm.subject).toEqual({ id: subjectId });
		expect(em.getReference).toHaveBeenCalledWith(SubjectOrmEntity, subjectId);
	});

	it.each<CommissionNumber | null>([1, 2, null])(
		'conserva commissionNumber=%s en toDomain',
		(commissionNumber) => {
			const orm = new ScheduleSlotOrmEntity();
			orm.id = 'slot-1';
			orm.subjectId = 'subject-1';
			orm.courseId = 'course-1';
			orm.dayOfWeek = DAYOFWEEK.MONDAY;
			orm.startTime = '08:00';
			orm.endTime = '09:00';
			orm.commissionNumber = commissionNumber;

			expect(ScheduleSlotMapper.toDomain(orm).commissionNumber).toBe(
				commissionNumber,
			);
		},
	);
});
