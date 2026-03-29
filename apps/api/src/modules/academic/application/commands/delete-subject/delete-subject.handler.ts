import { Injectable } from '@nestjs/common';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { DeleteSubjectCommand } from './delete-subject.command';

@Injectable()
export class DeleteSubjectHandler {
	constructor(private readonly subjectRepo: ISubjectRepository) {}
	async execute({ subjectId }: DeleteSubjectCommand) {
		const subject = await this.subjectRepo.findById(subjectId);
		if (!subject) throw new Error('Subject not found');
		subject.softDelete();
		await this.subjectRepo.save(subject);
	}
}
