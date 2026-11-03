import {
	ROLES,
	Roles,
	WORKSHOP_SHIFT_THEORY_SUBJECT_ATTENDANCE_MESSAGE,
} from '@repo/common';
import { DomainError, ForbiddenError } from '../../../../common/errors';
import {
	Subject,
	TaughtCommissions,
} from '../../domain/entities/subject.entity';

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
 * Who may record or alter attendance of a subject: admins, and the teachers the
 * subject is assigned to (in any of its commissions). Preceptors and other teachers are rejected. Cross-tenant
 * access, or an unknown tenant on either side, is always forbidden.
 */
export function assertCanWriteSubjectAttendance(
	subject: Subject,
	actor: SubjectActor,
): void {
	assertSameTenant(subject, actor);
	if (actor.role === ROLES.ADMIN) return;
	if (actor.role === ROLES.TEACHER && subject.isTaughtBy(actor.userId)) return;
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

/**
 * A theory subject of a workshop-only course (7th year technical) is taught in
 * the workshop shift: its attendance is the workshop one, taken by the
 * commission's preceptor, so no per-subject attendance exists for it.
 */
export function assertSubjectHasOwnAttendance(subject: Subject): void {
	if (!subject.hasOwnAttendance) {
		throw new DomainError(WORKSHOP_SHIFT_THEORY_SUBJECT_ATTENDANCE_MESSAGE);
	}
}

/**
 * Commissions whose students the actor may see and record in a subject:
 * teachers only the ones they teach ('all' for a whole-subject teacher);
 * admins and preceptors every one. Call it after the access assertions.
 */
export function taughtCommissionsOf(
	subject: Subject,
	actor: SubjectActor,
): TaughtCommissions {
	return actor.role === ROLES.TEACHER
		? subject.commissionsTaughtBy(actor.userId)
		: 'all';
}
