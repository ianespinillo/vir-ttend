import { BadRequestException } from '@nestjs/common';
import { DAYOFWEEK, SUBJECT_KIND, SubjectKindType } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { UpdateSubjectCommand } from '../../../../src/modules/academic/application/commands/update-subject/update-subject.command';
import { UpdateSubjectHandler } from '../../../../src/modules/academic/application/commands/update-subject/update-subject.handler';
import { ScheduleSlot } from '../../../../src/modules/academic/domain/entities/schedule-slot.entity';
import { Subject } from '../../../../src/modules/academic/domain/entities/subject.entity';
import { IScheduleRepository } from '../../../../src/modules/academic/domain/repositories/schedule.repository.interface';
import { ISubjectRepository } from '../../../../src/modules/academic/domain/repositories/subject.repository.interface';

describe('UpdateSubjectHandler', () => {
	let handler: UpdateSubjectHandler;
	let subjectRepo: MockProxy<ISubjectRepository>;
	let scheduleRepo: MockProxy<IScheduleRepository>;

	const makeSubject = (kind: SubjectKindType) =>
		Subject.reconstitute({
			id: 'sub-1',
			courseId: 'course-1',
			teacherId: 'teacher-1',
			name: 'Original',
			area: 'AreaOriginal',
			weeklyHours: 4,
			kind,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

	const makeSlot = (commissionNumber: 1 | 2 | null) =>
		ScheduleSlot.create({
			subjectId: 'sub-1',
			courseId: 'course-1',
			dayOfWeek: DAYOFWEEK.MONDAY,
			startTime: '08:00',
			endTime: '09:00',
			commissionNumber,
		});

	const kindOnly = (kind: SubjectKindType) =>
		new UpdateSubjectCommand(
			'sub-1',
			undefined,
			undefined,
			undefined,
			undefined,
			kind,
		);

	beforeEach(() => {
		subjectRepo = mock<ISubjectRepository>();
		scheduleRepo = mock<IScheduleRepository>();
		handler = new UpdateSubjectHandler(subjectRepo, scheduleRepo);
	});

	it('saves name and area in the right fields', async () => {
		subjectRepo.findById.mockResolvedValue(makeSubject(SUBJECT_KIND.THEORY));

		await handler.execute(
			new UpdateSubjectCommand('sub-1', undefined, 'Matemática', 'Exactas', 5),
		);

		const saved = subjectRepo.save.mock.calls[0][0];
		expect(saved.name).toBe('Matemática');
		expect(saved.area).toBe('Exactas');
		expect(saved.weeklyHours).toBe(5);
	});

	it('rejects workshop to theory when a slot has a commission', async () => {
		subjectRepo.findById.mockResolvedValue(makeSubject(SUBJECT_KIND.WORKSHOP));
		scheduleRepo.findBySubject.mockResolvedValue([makeSlot(null), makeSlot(1)]);

		await expect(
			handler.execute(kindOnly(SUBJECT_KIND.THEORY)),
		).rejects.toBeInstanceOf(BadRequestException);
		expect(subjectRepo.save).not.toHaveBeenCalled();
	});

	it('allows workshop to theory when no slot has a commission', async () => {
		subjectRepo.findById.mockResolvedValue(makeSubject(SUBJECT_KIND.WORKSHOP));
		scheduleRepo.findBySubject.mockResolvedValue([makeSlot(null)]);

		await handler.execute(kindOnly(SUBJECT_KIND.THEORY));

		expect(subjectRepo.save.mock.calls[0][0].kind).toBe(SUBJECT_KIND.THEORY);
	});

	it.each([
		[SUBJECT_KIND.WORKSHOP, SUBJECT_KIND.WORKSHOP],
		[SUBJECT_KIND.THEORY, SUBJECT_KIND.THEORY],
	])('does not block %s to %s', async (from, to) => {
		subjectRepo.findById.mockResolvedValue(makeSubject(from));
		scheduleRepo.findBySubject.mockResolvedValue([makeSlot(1)]);

		await handler.execute(kindOnly(to));

		expect(subjectRepo.save).toHaveBeenCalledTimes(1);
	});
});
