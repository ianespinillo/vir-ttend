import { StudentStatus } from '@repo/common';

export class GetStudentsByCourseQuery {
	constructor(
		public readonly tenantId: string,
		public readonly courseId: string,
		public readonly page: number,
		public readonly limit: number = 10,
		public readonly status?: StudentStatus,
	) {}
}
