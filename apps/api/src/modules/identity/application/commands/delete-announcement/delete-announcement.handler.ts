import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ROLES } from '@repo/common';
import { NotFoundError } from '../../../../../common/errors';
import { IAnnouncementRepository } from '../../../domain/repositories/announcement.repository.interface';
import { DeleteAnnouncementCommand } from './delete-announcement.command';

@Injectable()
export class DeleteAnnouncementHandler {
	constructor(
		@Inject('IAnnouncementRepository')
		private readonly announcementRepo: IAnnouncementRepository,
	) {}

	async execute(
		command: DeleteAnnouncementCommand,
	): Promise<{ success: boolean }> {
		if (command.actorRole !== ROLES.ADMIN) {
			throw new ForbiddenException('Solo un admin puede eliminar comunicados');
		}
		const announcement = await this.announcementRepo.findById(
			command.announcementId,
		);
		if (!announcement || announcement.schoolId !== command.schoolId) {
			throw new NotFoundError('Comunicado no encontrado.');
		}
		await this.announcementRepo.delete(command.announcementId);
		return { success: true };
	}
}
