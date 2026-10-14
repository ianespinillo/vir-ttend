import {
	CommissionNumber,
	DAYOFWEEK,
	SUBJECT_KIND,
	SubjectKindType,
} from '@repo/common';
import { ScheduleSlot } from '../../../src/modules/academic/domain/entities/schedule-slot.entity';
import { Subject } from '../../../src/modules/academic/domain/entities/subject.entity';
import { WorkshopCommissionAdapter } from '../../../src/modules/attendance/infrastructure/adapters/workshop-commission.adapter';

const subject = (id: string, kind: SubjectKindType) =>
	Subject.reconstitute({
		id,
		courseId: 'course-1',
		teacherId: 'teacher-1',
		name: id,
		area: 'area',
		weeklyHours: 2,
		kind,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

const slot = (
	subjectId: string,
	dayOfWeek: DAYOFWEEK,
	commissionNumber: CommissionNumber | null,
) =>
	ScheduleSlot.reconstitute({
		id: `${subjectId}-${dayOfWeek}`,
		subjectId,
		courseId: 'course-1',
		dayOfWeek,
		startTime: '08:00',
		endTime: '10:00',
		commissionNumber,
		createdAt: new Date(),
	});

describe('WorkshopCommissionAdapter.getWorkshopDays', () => {
	const build = () =>
		new WorkshopCommissionAdapter(
			{} as never,
			{} as never,
			{} as never,
			{
				findByCourse: jest
					.fn()
					.mockResolvedValue([
						subject('carpentry', SUBJECT_KIND.WORKSHOP),
						subject('math', SUBJECT_KIND.THEORY),
					]),
			} as never,
			{
				findByCourse: jest
					.fn()
					.mockResolvedValue([
						slot('carpentry', DAYOFWEEK.MONDAY, null),
						slot('carpentry', DAYOFWEEK.TUESDAY, 1),
						slot('carpentry', DAYOFWEEK.WEDNESDAY, 2),
						slot('math', DAYOFWEEK.THURSDAY, null),
					]),
			} as never,
		);

	it('keeps slots for both commissions and for the given commission', async () => {
		expect(await build().getWorkshopDays('course-1', 1)).toEqual([
			DAYOFWEEK.MONDAY,
			DAYOFWEEK.TUESDAY,
		]);
		expect(await build().getWorkshopDays('course-1', 2)).toEqual([
			DAYOFWEEK.MONDAY,
			DAYOFWEEK.WEDNESDAY,
		]);
	});

	it('ignores slots of theory subjects', async () => {
		const days = await build().getWorkshopDays('course-1', 1);
		expect(days).not.toContain(DAYOFWEEK.THURSDAY);
	});
});
