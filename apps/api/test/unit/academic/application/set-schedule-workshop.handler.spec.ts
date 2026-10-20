import { DAYOFWEEK, SUBJECT_KIND, SubjectKindType } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { DomainError } from '../../../../src/common/errors/domain.error';
import { SetScheduleCommand } from '../../../../src/modules/academic/application/commands/set-schedule/set-schedule.command';
import { SetScheduleHandler } from '../../../../src/modules/academic/application/commands/set-schedule/set-schedule.handler';
import { Course } from '../../../../src/modules/academic/domain/entities/course.entity';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';
import { WorkshopCommission } from '../../../../src/modules/academic/domain/entities/workshop-commission.entity';
import { ICourseRepository } from '../../../../src/modules/academic/domain/repositories/course.repository.interface';
import { IScheduleRepository } from '../../../../src/modules/academic/domain/repositories/schedule.repository.interface';
import { ISubjectRepository } from '../../../../src/modules/academic/domain/repositories/subject.repository.interface';
import { IWorkshopCommissionRepository } from '../../../../src/modules/academic/domain/repositories/workshop-commission.repository.interface';

describe('SetScheduleHandler - workshop commissions', () => {
	let handler: SetScheduleHandler;
	let scheduleRepository: MockProxy<IScheduleRepository>;
	let subjectRepository: MockProxy<ISubjectRepository>;
	let courseRepository: MockProxy<ICourseRepository>;
	let commissionRepository: MockProxy<IWorkshopCommissionRepository>;

	const subjectOf = (id: string, kind: SubjectKindType, weeklyHours = 4) =>
		Subject.reconstitute({
			id,
			courseId: 'course-1',
			teacherId: 'teacher-1',
			name: id,
			area: 'Area',
			weeklyHours,
			kind,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

	beforeEach(() => {
		scheduleRepository = mock<IScheduleRepository>();
		subjectRepository = mock<ISubjectRepository>();
		courseRepository = mock<ICourseRepository>();
		commissionRepository = mock<IWorkshopCommissionRepository>();
		commissionRepository.findByCourse.mockResolvedValue([]);
		scheduleRepository.findByCourse.mockResolvedValue([]);
		handler = new SetScheduleHandler(
			scheduleRepository,
			subjectRepository,
			courseRepository,
			commissionRepository,
		);
	});

	it('persists commission numbers on workshop subject slots', async () => {
		subjectRepository.findById.mockResolvedValue(
			subjectOf('workshop-1', SUBJECT_KIND.WORKSHOP),
		);

		await handler.execute(
			new SetScheduleCommand('workshop-1', [
				{
					dayOfWeek: DAYOFWEEK.MONDAY,
					startTime: '08:00',
					endTime: '12:00',
					commissionNumber: 1,
				},
				{
					dayOfWeek: DAYOFWEEK.MONDAY,
					startTime: '08:00',
					endTime: '12:00',
					commissionNumber: 2,
				},
			]),
		);

		const saved = scheduleRepository.saveMany.mock.calls[0][0];
		expect(saved.map((s) => s.commissionNumber)).toEqual([1, 2]);
	});

	it('rejects a commission number on a theory subject', async () => {
		subjectRepository.findById.mockResolvedValue(
			subjectOf('theory-1', SUBJECT_KIND.THEORY),
		);

		await expect(
			handler.execute(
				new SetScheduleCommand('theory-1', [
					{
						dayOfWeek: DAYOFWEEK.MONDAY,
						startTime: '08:00',
						endTime: '09:00',
						commissionNumber: 1,
					},
				]),
			),
		).rejects.toThrow(DomainError);
		expect(scheduleRepository.saveMany).not.toHaveBeenCalled();
	});

	it('validates the whole course schedule against subject kinds', async () => {
		courseRepository.findById.mockResolvedValue(mock<Course>());
		subjectRepository.findByCourse.mockResolvedValue([
			subjectOf('theory-1', SUBJECT_KIND.THEORY),
			subjectOf('workshop-1', SUBJECT_KIND.WORKSHOP),
		]);

		await expect(
			handler.execute(
				new SetScheduleCommand(
					undefined,
					[
						{
							subjectId: 'theory-1',
							dayOfWeek: DAYOFWEEK.MONDAY,
							startTime: '08:00',
							endTime: '09:00',
							commissionNumber: 2,
						},
					],
					'course-1',
				),
			),
		).rejects.toThrow(/taller/);

		await handler.execute(
			new SetScheduleCommand(
				undefined,
				[
					{
						subjectId: 'workshop-1',
						dayOfWeek: DAYOFWEEK.TUESDAY,
						startTime: '14:00',
						endTime: '18:00',
						commissionNumber: 1,
					},
					{
						subjectId: 'workshop-1',
						dayOfWeek: DAYOFWEEK.WEDNESDAY,
						startTime: '14:00',
						endTime: '18:00',
						commissionNumber: 2,
					},
				],
				'course-1',
			),
		);
		expect(scheduleRepository.saveMany).toHaveBeenCalledTimes(1);
	});

	describe('with existing commissions', () => {
		const commissionOf = (number: 1 | 2) =>
			WorkshopCommission.reconstitute({
				id: `commission-${number}`,
				tenantId: 'tenant-1',
				courseId: 'course-1',
				number,
				preceptorId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
		const workshopSlot = (commissionNumber: 1 | 2 | null) => ({
			subjectId: 'workshop-1',
			dayOfWeek: DAYOFWEEK.TUESDAY,
			startTime: '14:00',
			endTime: '16:00',
			commissionNumber,
		});

		beforeEach(() => {
			courseRepository.findById.mockResolvedValue(mock<Course>());
			subjectRepository.findByCourse.mockResolvedValue([
				subjectOf('workshop-1', SUBJECT_KIND.WORKSHOP),
			]);
		});

		it('rejects a slot for commission 2 when the course only has commission 1', async () => {
			commissionRepository.findByCourse.mockResolvedValue([commissionOf(1)]);

			await expect(
				handler.execute(
					new SetScheduleCommand(undefined, [workshopSlot(2)], 'course-1'),
				),
			).rejects.toThrow(
				'El curso no tiene la comisión 2: tiene una sola comisión de taller.',
			);
			expect(commissionRepository.findByCourse).toHaveBeenCalledWith('course-1');
			expect(scheduleRepository.saveMany).not.toHaveBeenCalled();
		});

		it('rejects commission 2 on the per-subject path too', async () => {
			commissionRepository.findByCourse.mockResolvedValue([commissionOf(1)]);
			subjectRepository.findById.mockResolvedValue(
				subjectOf('workshop-1', SUBJECT_KIND.WORKSHOP),
			);
			const { subjectId: _ignored, ...slot } = workshopSlot(2);

			await expect(
				handler.execute(new SetScheduleCommand('workshop-1', [slot])),
			).rejects.toThrow(DomainError);
			expect(scheduleRepository.saveMany).not.toHaveBeenCalled();
		});

		it('accepts slots for commission 1 or both when there is a single commission', async () => {
			commissionRepository.findByCourse.mockResolvedValue([commissionOf(1)]);

			await handler.execute(
				new SetScheduleCommand(
					undefined,
					[workshopSlot(1), { ...workshopSlot(null), dayOfWeek: DAYOFWEEK.FRIDAY }],
					'course-1',
				),
			);
			expect(scheduleRepository.saveMany).toHaveBeenCalledTimes(1);
		});

		it('still accepts slots for commissions 1 and 2 when both exist', async () => {
			commissionRepository.findByCourse.mockResolvedValue([
				commissionOf(1),
				commissionOf(2),
			]);

			await handler.execute(
				new SetScheduleCommand(
					undefined,
					[workshopSlot(1), workshopSlot(2)],
					'course-1',
				),
			);
			const saved = scheduleRepository.saveMany.mock.calls[0][0];
			expect(saved.map((s) => s.commissionNumber)).toEqual([1, 2]);
		});
	});
});
