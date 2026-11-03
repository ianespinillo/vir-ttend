import type { ISubjectResponse } from '@repo/common';

type SubjectTeachersView = Pick<ISubjectResponse, 'teacherName' | 'teachers'>;

const NO_TEACHER = 'Sin asignar';

/** Teachers assigned to one specific commission (the split case only). */
const commissionEntries = (subject: SubjectTeachersView) =>
	(subject.teachers ?? []).filter((entry) => entry.commissionNumber !== null);

/** True when the subject has a different teacher assignment per commission. */
export function hasCommissionTeachers(subject: SubjectTeachersView): boolean {
	return commissionEntries(subject).length > 0;
}

/**
 * Teacher label of a subject: "C1: Ana · C2: Luis" when split per commission,
 * otherwise the single teacher name. Undefined when there is no teacher.
 */
export function formatSubjectTeachers(
	subject: SubjectTeachersView,
): string | undefined {
	if (!hasCommissionTeachers(subject)) return subject.teacherName || undefined;
	const entries = commissionEntries(subject);
	return [1, 2]
		.map((number) => {
			const name = entries.find((e) => e.commissionNumber === number)?.teacherName;
			return `C${number}: ${name || NO_TEACHER}`;
		})
		.join(' · ');
}

/**
 * Teacher label for a schedule slot: the slot commission's teacher when the
 * subject is split, otherwise the same label as the subject.
 */
export function formatSlotTeacher(
	subject: SubjectTeachersView,
	commissionNumber: number | null | undefined,
): string | undefined {
	if (commissionNumber != null && hasCommissionTeachers(subject)) {
		return commissionEntries(subject).find(
			(e) => e.commissionNumber === commissionNumber,
		)?.teacherName;
	}
	return formatSubjectTeachers(subject);
}
