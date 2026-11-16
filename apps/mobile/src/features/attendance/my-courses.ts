import type { AttendanceRecordItem, MySubject, StudentItem } from './types';

export interface CourseSubjects {
	courseId: string;
	courseName: string;
	subjects: MySubject[];
}

/** Groups the teacher's subjects by course, both sorted by name. */
export const groupSubjectsByCourse = (
	subjects: MySubject[],
): CourseSubjects[] => {
	const byCourse = new Map<string, CourseSubjects>();
	for (const subject of subjects) {
		const group = byCourse.get(subject.courseId) ?? {
			courseId: subject.courseId,
			courseName: subject.courseName,
			subjects: [],
		};
		group.subjects.push(subject);
		byCourse.set(subject.courseId, group);
	}
	return [...byCourse.values()]
		.map((group) => ({
			...group,
			subjects: [...group.subjects].sort((a, b) => a.name.localeCompare(b.name)),
		}))
		.sort((a, b) => a.courseName.localeCompare(b.courseName));
};

/** Display names of a roster, "Last, First", sorted alphabetically. */
export const studentNames = (students: StudentItem[]): string[] =>
	students
		.map((s) =>
			s.lastName || s.firstName
				? [s.lastName, s.firstName].filter(Boolean).join(', ')
				: (s.fullName ?? 'Alumno'),
		)
		.sort((a, b) => a.localeCompare(b));

/** Display names of a roster that comes as attendance records. */
export const recordStudentNames = (records: AttendanceRecordItem[]): string[] =>
	records
		.map((r) => r.studentName ?? 'Alumno')
		.sort((a, b) => a.localeCompare(b));
