import { ROLES, Roles } from '@repo/common';
import { ForbiddenError } from '../../../../common/errors';
import { Subject } from '../../domain/entities/subject.entity';

export interface SubjectActor {
	userId: string;
	role: Roles;
	tenantId: string;
}

/**
 * Fails closed: a subject or an actor without a known tenant can never be
 * matched, so an unresolved tenant is rejected instead of skipping the check.
 */
function assertSameTenant(subject: Subject, actor: SubjectActor): void {
	if (
		!subject.tenantId ||
		!actor.tenantId ||
		subject.tenantId !== actor.tenantId
	) {
		throw new ForbiddenError('No tiene acceso a esta materia');
	}
}

/**
 * Who may record or alter attendance of a subject: admins, and the teacher the
 * subject is assigned to. Preceptors and other teachers are rejected. Cross-tenant
 * access, or an unknown tenant on either side, is always forbidden.
 */
export function assertCanWriteSubjectAttendance(
	subject: Subject,
	actor: SubjectActor,
): void {
	assertSameTenant(subject, actor);
	if (actor.role === ROLES.ADMIN) return;
	if (actor.role === ROLES.TEACHER && subject.teacherId === actor.userId) return;
	throw new ForbiddenError(
		'No tiene permiso para gestionar la asistencia de esta materia',
	);
}

/**
 * Who may read attendance of a subject: everyone allowed to write it, plus
 * preceptors (they oversee the courses the subject belongs to). Cross-tenant
 * access is always forbidden.
 */
export function assertCanReadSubjectAttendance(
	subject: Subject,
	actor: SubjectActor,
): void {
	assertSameTenant(subject, actor);
	if (actor.role === ROLES.PRECEPTOR) return;
	assertCanWriteSubjectAttendance(subject, actor);
}
