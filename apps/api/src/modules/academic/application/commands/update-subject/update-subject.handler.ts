import { Injectable } from '@nestjs/common';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { UpdateSubjectCommand } from './update-subject.command';

@Injectable()
export class UpdateSubjectHandler {
	constructor(private readonly subjectRepo: ISubjectRepository) {}
	async execute(command: UpdateSubjectCommand) {
		const subject = await this.subjectRepo.findById(command.subjectId);
		if (!subject) throw new Error('Subject not found');
		if (command.teacherId) subject.assignTeacher(command.teacherId);
		subject.updateDetails(command.name, command.area, command.weeklyHours);
		await this.subjectRepo.save(subject);
	}
}
