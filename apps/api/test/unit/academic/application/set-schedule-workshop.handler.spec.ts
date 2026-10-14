import { DAYOFWEEK, SUBJECT_KIND, SubjectKindType } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { DomainError } from '../../../../src/common/errors/domain.error';
import { SetScheduleCommand } from '../../../../src/modules/academic/application/commands/set-schedule/set-schedule.command';
import { SetScheduleHandler } from '../../../../src/modules/academic/application/commands/set-schedule/set-schedule.handler';
import { Course } from '../../../../src/modules/academic/domain/entities/course.entity';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';
import { ICourseRepository } from '../../../../src/modules/academic/domain/repositories/course.repository.interface';
import { IScheduleRepository } from '../../../../src/modules/academic/domain/repositories/schedule.repository.interface';
import { ISubjectRepository } from '../../../../src/modules/academic/domain/repositories/subject.repository.interface';

describe('SetScheduleHandler - workshop commissions', () => {
	let handler: SetScheduleHandler;
	let scheduleRepository: MockProxy<IScheduleRepository>;
	let subjectRepository: MockProxy<ISubjectRepository>;
	let courseRepository: MockProxy<ICourseRepository>;

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
		scheduleRepository.findByCourse.mockResolvedValue([]);
		handler = new SetScheduleHandler(
			scheduleRepository,
			subjectRepository,
			courseRepository,
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
});
