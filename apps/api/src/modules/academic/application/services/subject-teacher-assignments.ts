import { BusinessRuleError, DomainError } from '../../../../common/errors';
import { IMembershipPort } from '../../domain/ports/membership.port.interface';
import { IWorkshopCommissionRepository } from '../../domain/repositories/workshop-commission.repository.interface';
import { SubjectTeacherAssignment } from '../../domain/value-objects/subject-teacher-assignment.vo';

export interface TeacherInput {
	/** Per-commission teachers; when present they win over teacherId / teacherName. */
	teachers?: SubjectTeacherAssignment[];
	/** Whole-subject teacher; "NONE" or empty means no account. */
	teacherId?: string;
	teacherName?: string;
}

/** The "no teacher" marker clients send in teacherId. */
const NO_TEACHER = 'NONE';

function realTeacherId(teacherId?: string): string | undefined {
	return teacherId && teacherId !== NO_TEACHER ? teacherId : undefined;
}

/**
 * The assignments a create/update request asks for: the `teachers` list when
 * present, else the single whole-subject teacher from teacherId / teacherName.
 * An account always wins over a plain name.
 */
export function requestedAssignments(
	input: TeacherInput,
): SubjectTeacherAssignment[] {
	if (input.teachers) {
		return input.teachers.map((a) => ({
			commissionNumber: a.commissionNumber ?? null,
			teacherId: realTeacherId(a.teacherId),
			teacherName: a.teacherName,
		}));
	}
	const teacherId = realTeacherId(input.teacherId);
	return [
		{
			commissionNumber: null,
			teacherId,
			teacherName: teacherId ? undefined : input.teacherName,
		},
	];
}

/** Every account teaching must belong to the course's school. */
export async function assertTeachersBelongToTenant(
	membershipPort: IMembershipPort,
	teacherIds: string[],
	tenantId: string,
): Promise<void> {
	for (const teacherId of new Set(teacherIds)) {
		const belongs = await membershipPort.belongsToTenant(teacherId, tenantId);
		if (!belongs)
			throw new DomainError('El profesor no pertenece a la institución.');
	}
}

/**
 * A teacher per commission only makes sense when the course splits its
 * workshops into two commissions.
 */
export async function assertCommissionsExist(
	commissionRepo: IWorkshopCommissionRepository,
	courseId: string,
	assignments: Pick<SubjectTeacherAssignment, 'commissionNumber'>[],
): Promise<void> {
	if (assignments.every((a) => a.commissionNumber === null)) return;
	const commissions = await commissionRepo.findByCourse(courseId);
	if (commissions.length < 2)
		throw new BusinessRuleError(
			'El curso debe tener dos comisiones de taller para asignar un docente por comisión.',
		);
}
