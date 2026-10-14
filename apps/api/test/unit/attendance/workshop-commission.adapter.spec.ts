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

describe('WorkshopCommissionAdapter.findByStudent', () => {
	const build = (workshopCommissionId: string | null) => {
		const commissionRepository = {
			findById: jest.fn().mockResolvedValue({
				id: 'commission-1',
				tenantId: 'tenant-1',
				courseId: 'course-1',
				number: 2,
				preceptorId: null,
				code: () => '142',
			}),
		};
		const adapter = new WorkshopCommissionAdapter(
			commissionRepository as never,
			{
				findById: jest
					.fn()
					.mockResolvedValue({ yearNumber: 1, division: 4, isActive: true }),
			} as never,
			{ findById: jest.fn().mockResolvedValue({ workshopCommissionId }) } as never,
			{} as never,
			{} as never,
		);
		return { adapter, commissionRepository };
	};

	it('resolves the commission the student belongs to', async () => {
		const { adapter, commissionRepository } = build('commission-1');
		const info = await adapter.findByStudent('student-1');
		expect(commissionRepository.findById).toHaveBeenCalledWith('commission-1');
		expect(info).toMatchObject({ courseId: 'course-1', number: 2 });
	});

	it('returns null for a student without a commission', async () => {
		const { adapter, commissionRepository } = build(null);
		expect(await adapter.findByStudent('student-1')).toBeNull();
		expect(commissionRepository.findById).not.toHaveBeenCalled();
	});
});
