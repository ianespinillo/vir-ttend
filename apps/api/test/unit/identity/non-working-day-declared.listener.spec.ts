import { SHIFT } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { NonWorkingDayDeclaredEvent } from '../../../src/modules/academic/events/non-working-day-declared.event';
import { Announcement } from '../../../src/modules/identity/domain/entities/announcement.entity';
import { IAnnouncementRepository } from '../../../src/modules/identity/domain/repositories/announcement.repository.interface';
import { NonWorkingDayDeclaredListener } from '../../../src/modules/identity/infrastructure/events/non-working-day-declared.listener';

describe('NonWorkingDayDeclaredListener', () => {
	let listener: NonWorkingDayDeclaredListener;
	let announcementRepo: MockProxy<IAnnouncementRepository>;
	let em: { name: string; fork: jest.Mock };
	let forkedEm: object;

	beforeEach(() => {
		announcementRepo = mock<IAnnouncementRepository>();
		forkedEm = { name: 'default' };
		em = { name: 'default', fork: jest.fn().mockReturnValue(forkedEm) };
		listener = new NonWorkingDayDeclaredListener(announcementRepo, em as never);
	});

	it('should save a published school-wide announcement when event is handled', async () => {
		const targetDate = new Date('2026-05-15T00:00:00.000Z');
		const event = new NonWorkingDayDeclaredEvent(
			'year-1',
			'tenant-1',
			targetDate,
			'Paro docente por reclamo salarial',
			'user-1',
			'strike',
		);

		await listener.handle(event);

		expect(announcementRepo.save).toHaveBeenCalledTimes(1);
		const savedAnnouncement = announcementRepo.save.mock
			.calls[0][0] as Announcement;
		expect(savedAnnouncement.schoolId).toBe('tenant-1');
		expect(savedAnnouncement.tenantId).toBe('tenant-1');
		expect(savedAnnouncement.authorId).toBe('user-1');
		expect(savedAnnouncement.target.type).toBe('school');
		expect(savedAnnouncement.target.id).toBe('');
		expect(savedAnnouncement.status).toBe('published');
		expect(savedAnnouncement.title).toContain('Paro docente');
		expect(savedAnnouncement.body).toContain('15/05/2026');
		expect(savedAnnouncement.body).toContain('Paro docente por reclamo salarial');
	});

	it('should keep the whole-school wording when no shift is scoped', async () => {
		await listener.handle(
			new NonWorkingDayDeclaredEvent(
				'year-1',
				'tenant-1',
				new Date('2026-05-15T00:00:00.000Z'),
				'Feriado',
				'user-1',
			),
		);

		const saved = announcementRepo.save.mock.calls[0][0] as Announcement;
		expect(saved.body).not.toContain('turno');
	});

	it('should mention a single affected shift in the announcement', async () => {
		await listener.handle(
			new NonWorkingDayDeclaredEvent(
				'year-1',
				'tenant-1',
				new Date('2026-05-15T00:00:00.000Z'),
				'Paro docente',
				'user-1',
				'strike',
				[SHIFT.MORNING],
			),
		);

		const saved = announcementRepo.save.mock.calls[0][0] as Announcement;
		expect(saved.body).toContain('en el turno mañana');
		expect(saved.body).toContain('para el turno mañana');
	});

	it('should list several affected shifts in the announcement', async () => {
		await listener.handle(
			new NonWorkingDayDeclaredEvent(
				'year-1',
				'tenant-1',
				new Date('2026-05-15T00:00:00.000Z'),
				'Paro docente',
				'user-1',
				'strike',
				[SHIFT.MORNING, SHIFT.AFTERNOON, SHIFT.EVENING],
			),
		);

		const saved = announcementRepo.save.mock.calls[0][0] as Announcement;
		expect(saved.body).toContain('turnos mañana, tarde y noche');
	});

	it('should catch and log error without throwing if save fails', async () => {
		announcementRepo.save.mockRejectedValue(new Error('DB failure'));

		const event = new NonWorkingDayDeclaredEvent(
			'year-1',
			'tenant-1',
			new Date('2026-05-15T00:00:00.000Z'),
			'Feriado',
			'user-1',
		);

		await expect(listener.handle(event)).resolves.not.toThrow();
	});
});
