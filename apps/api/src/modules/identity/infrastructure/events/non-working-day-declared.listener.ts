import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { describeShiftScope } from '@repo/common';
import { NonWorkingDayDeclaredEvent } from '../../../academic/events/non-working-day-declared.event';
import { Announcement } from '../../domain/entities/announcement.entity';
import { IAnnouncementRepository } from '../../domain/repositories/announcement.repository.interface';
import { AnnouncementTarget } from '../../domain/value-objects/announcement-target.value-object';

@Injectable()
export class NonWorkingDayDeclaredListener {
	private readonly logger = new Logger(NonWorkingDayDeclaredListener.name);

	constructor(
		@Inject('IAnnouncementRepository')
		private readonly announcementRepo: IAnnouncementRepository,
		private readonly em: EntityManager,
	) {}

	@OnEvent('non-working-day.declared')
	async handle(event: NonWorkingDayDeclaredEvent): Promise<void> {
		try {
			await RequestContext.create(this.em, () => this.createAnnouncement(event));
		} catch (error) {
			this.logger.error(
				`Failed to create announcement for non-working day on ${event.date}: ${
					error instanceof Error ? error.message : String(error)
				}`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}

	private async createAnnouncement(
		event: NonWorkingDayDeclaredEvent,
	): Promise<void> {
		const formattedDate = new Date(event.date).toLocaleDateString('es-AR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			timeZone: 'UTC',
		});

		const title = `Suspensión de actividades — ${event.reason}`;
		const shiftScope = describeShiftScope(event.shifts);
		const where = shiftScope ? ` en el ${shiftScope}` : '';
		const registered = shiftScope
			? `El día ha sido registrado como no laborable para el ${shiftScope}`
			: 'El día ha sido registrado como no laborable';
		const body = `Se informa a toda la comunidad educativa que el día ${formattedDate} no habrá dictado de clases ni actividades escolares${where} debido a: ${event.reason}. ${registered} en el calendario académico institucional.`;

		const target = new AnnouncementTarget('school', '');
		const announcement = Announcement.create({
			schoolId: event.tenantId,
			tenantId: event.tenantId,
			authorId: event.authorId,
			title,
			body,
			target,
		});

		await this.announcementRepo.save(announcement);
		this.logger.log(
			`Institutional announcement created for non-working day ${formattedDate} in tenant ${event.tenantId}`,
		);
	}
}
