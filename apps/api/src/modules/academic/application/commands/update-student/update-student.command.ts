import { Tutor } from '../../../domain/value-objects/tutor.vo';
export class UpdateStudentCommand {
	constructor(
		public readonly studentId: string,
		public readonly firstName?: string,
		public readonly lastName?: string,
		public readonly birthDate?: Date,
		public readonly tutorName?: string,
		public readonly tutorPhone?: string,
		public readonly tutorEmail?: string,
	) {}
}
