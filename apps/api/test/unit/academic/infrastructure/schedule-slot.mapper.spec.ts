import { EntityManager } from '@mikro-orm/core';
import { DAYOFWEEK } from '@repo/common';
import { ScheduleSlot } from '../../../../src/modules/academic/domain/entities/schedule-slot.entity';
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
});
