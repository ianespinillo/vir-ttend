import { Inject, Injectable } from '@nestjs/common';
import { IScheduleRepository } from '../../../domain/repositories/schedule.repository.interface';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { DeleteSubjectCommand } from './delete-subject.command';

@Injectable()
export class DeleteSubjectHandler {
	constructor(
		@Inject('ISubjectRepository')
		private readonly subjectRepo: ISubjectRepository,
		@Inject('IScheduleRepository')
		private readonly scheduleRepo: IScheduleRepository,
	) {}
	async execute({ subjectId }: DeleteSubjectCommand) {
		const subject = await this.subjectRepo.findById(subjectId);
		if (!subject) throw new Error('Subject not found');
		subject.softDelete();
		await this.subjectRepo.save(subject);
		// Cascade: remove the subject's schedule slots so no orphan slots remain.
		await this.scheduleRepo.deleteBySubject(subjectId);
	}
}
