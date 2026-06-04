import { LevelType } from '@repo/common';
import { AcademicYearId } from '../../../domain/value-objects/academic-year-id.vo';
export class GetStudentsByGradeQuery {
	constructor(
		public readonly academicYearId: AcademicYearId,
		public readonly yearNumber: number,
		public readonly level: LevelType,
	) {}
}
