import { CourseId } from '../../../domain/value-objects/course-id.vo';
import { DocumentNumber } from '../../../domain/value-objects/document-number.vo';
import { Tutor } from '../../../domain/value-objects/tutor.vo';
export class CreateStudentCommand {
	constructor(
		public readonly tenantId: string,
		public readonly firstName: string,
		public readonly lastName: string,
		public readonly courseId: string,
		public readonly documentNumber: string,
		public readonly birthDate: Date,
		public readonly tutorName: string,
		public readonly tutorPhone: string,
		public readonly tutorEmail?: string,
	) {}
}
