import { StudentStatus } from '@repo/common';

export class GetStudentsByCourseQuery {
	constructor(
		public readonly tenantId: string,
		public readonly courseId?: string,
		public readonly page: number = 1,
		public readonly limit: number = 10,
		public readonly status?: StudentStatus,
		public readonly search?: string,
	) {}
}
