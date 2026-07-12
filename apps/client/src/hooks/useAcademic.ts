import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Course, Student, Subject } from '../entities';
import { AcademicService } from '../services/api.service';

const EMPTY_ARRAY: never[] = [];

export const useAcademic = (courseId?: string) => {
	const queryClient = useQueryClient();

	const coursesQuery = useQuery<Course[]>({
		queryKey: ['courses'],
		queryFn: AcademicService.getCourses,
		staleTime: 1000 * 60 * 5, // 5 minutes cache
	});

	const subjectsQuery = useQuery<Subject[]>({
		queryKey: ['subjects'],
		queryFn: AcademicService.getSubjects,
		staleTime: 1000 * 60 * 5,
	});

	const studentsQuery = useQuery<Student[]>({
		queryKey: ['students', courseId],
		queryFn: () => AcademicService.getStudents(courseId),
		staleTime: 1000 * 60 * 5,
	});

	const enrollStudentMutation = useMutation({
		mutationFn: AcademicService.enrollStudent,
		onSuccess: (newStudent) => {
			// Invalidate queries to refresh lists
			queryClient.invalidateQueries({ queryKey: ['students'] });
			// Optionally update the query data directly for instant UI updates
			queryClient.setQueryData<Student[]>(
				['students', newStudent.courseId],
				(old = []) => [...old, newStudent],
			);
		},
	});

	return {
		courses: coursesQuery.data ?? EMPTY_ARRAY,
		isCoursesLoading: coursesQuery.isLoading,

		subjects: subjectsQuery.data ?? EMPTY_ARRAY,
		isSubjectsLoading: subjectsQuery.isLoading,

		students: studentsQuery.data ?? EMPTY_ARRAY,
		isStudentsLoading: studentsQuery.isLoading,
		studentsError: studentsQuery.error,

		enrollStudent: enrollStudentMutation.mutateAsync,
		isEnrolling: enrollStudentMutation.isPending,
	};
};
