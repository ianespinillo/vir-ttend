'use client';

import { useAuth } from '@/lib/auth/provider';
import type { IStudentResponse, StudentStatus } from '@repo/common';
import {
	useActiveAcademicYear,
	useCourses,
	useDeleteStudent,
	useEnrollStudent,
	useStudents,
	useTransferStudent,
} from '@repo/hooks';
import { type StudentFiltersState, StudentsPage } from '@repo/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { toast } from 'sonner';

export default function Page() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { user } = useAuth();

	const role = user?.role?.toLowerCase();
	const isAdmin = role === 'admin' || role === 'superadmin';
	const isPreceptor = role === 'preceptor';

	const search = searchParams.get('search') || undefined;
	const courseId = searchParams.get('courseId') || undefined;
	const status = searchParams.get('status') || undefined;
	const pageParam = Number.parseInt(searchParams.get('page') || '1', 10);
	const page = Number.isNaN(pageParam) ? 1 : pageParam;

	const filtersState: StudentFiltersState = {
		search,
		courseId,
		status,
	};

	const { data: activeYear } = useActiveAcademicYear();
	const { data: coursesData } = useCourses({ academicYearId: activeYear?.id });
	const courses = coursesData ?? [];

	const { data: studentsResponse, isLoading } = useStudents({
		search,
		courseId,
		status: status as StudentStatus | undefined,
		page,
		limit: 10,
	});

	const enrollMutation = useEnrollStudent();
	const transferMutation = useTransferStudent();
	const deleteMutation = useDeleteStudent();

	const updateQueryParams = useCallback(
		(newParams: Record<string, string | number | undefined>) => {
			const params = new URLSearchParams(searchParams.toString());
			for (const [key, val] of Object.entries(newParams)) {
				if (val === undefined || val === '') {
					params.delete(key);
				} else {
					params.set(key, String(val));
				}
			}
			router.push(`${pathname}?${params.toString()}`);
		},
		[pathname, router, searchParams],
	);

	const handleFiltersChange = (newFilters: StudentFiltersState) => {
		updateQueryParams({
			search: newFilters.search,
			courseId: newFilters.courseId,
			status: newFilters.status,
			page: 1, // Reset to page 1 on filter change
		});
	};

	const handlePageChange = (newPage: number) => {
		updateQueryParams({ page: newPage });
	};

	const handleView = (id: string) => {
		router.push(`/students/${id}`);
	};

	const handleCreate = () => {
		router.push('/students/create');
	};

	const handleEdit = (id: string) => {
		router.push(`/students/${id}?edit=true`);
	};

	const handleEnrollSubmit = async (
		studentId: string,
		targetCourseId: string,
	) => {
		try {
			await enrollMutation.mutateAsync({
				id: studentId,
				data: { courseId: targetCourseId },
			});
			toast.success('Estudiante matriculado exitosamente', {
				action: {
					label: 'Ver alumno',
					onClick: () => router.push(`/students/${studentId}`),
				},
			});
		} catch (err: unknown) {
			const errorObj = err as {
				response?: { data?: { message?: string } };
				message?: string;
			};
			toast.error(
				errorObj?.response?.data?.message ||
					errorObj?.message ||
					'Error al matricular el estudiante',
			);
		}
	};

	const handleChangeCourseSubmit = async (
		studentId: string,
		targetCourseId: string,
	) => {
		try {
			await enrollMutation.mutateAsync({
				id: studentId,
				data: { courseId: targetCourseId },
			});
			toast.success('Curso cambiado exitosamente', {
				action: {
					label: 'Ver alumno',
					onClick: () => router.push(`/students/${studentId}`),
				},
			});
		} catch (err: unknown) {
			const errorObj = err as {
				response?: { data?: { message?: string } };
				message?: string;
			};
			toast.error(
				errorObj?.response?.data?.message ||
					errorObj?.message ||
					'Error al cambiar el curso del estudiante',
			);
		}
	};

	const handleTransferSubmit = async (student: IStudentResponse) => {
		if (
			!window.confirm(
				`¿Confirma el traslado de ${student.fullName} a otra escuela? El alumno quedará marcado como Transferido.`,
			)
		) {
			return;
		}
		try {
			await transferMutation.mutateAsync({ id: student.id });
			toast.success('Estudiante trasladado a otra escuela', {
				action: {
					label: 'Ver alumno',
					onClick: () => router.push(`/students/${student.id}`),
				},
			});
		} catch (err: unknown) {
			const errorObj = err as {
				response?: { data?: { message?: string } };
				message?: string;
			};
			toast.error(
				errorObj?.response?.data?.message ||
					errorObj?.message ||
					'Error al trasladar el estudiante',
			);
		}
	};

	const handleDeactivate = async (student: IStudentResponse) => {
		if (
			window.confirm(`¿Está seguro de que desea desactivar a ${student.fullName}?`)
		) {
			try {
				await deleteMutation.mutateAsync(student.id);
				toast.success('Estudiante desactivado exitosamente');
			} catch (err: unknown) {
				const errorObj = err as {
					response?: { data?: { message?: string } };
					message?: string;
				};
				toast.error(
					errorObj?.response?.data?.message ||
						errorObj?.message ||
						'Error al desactivar el estudiante',
				);
			}
		}
	};

	return (
		<StudentsPage
			students={studentsResponse?.items || []}
			total={studentsResponse?.total || 0}
			page={studentsResponse?.page || page}
			totalPages={studentsResponse?.totalPages || 1}
			isLoading={isLoading}
			filters={filtersState}
			onFiltersChange={handleFiltersChange}
			onPageChange={handlePageChange}
			courses={courses}
			onView={handleView}
			onCreate={handleCreate}
			onEdit={handleEdit}
			onEnrollSubmit={handleEnrollSubmit}
			onChangeCourseSubmit={handleChangeCourseSubmit}
			onTransferSubmit={handleTransferSubmit}
			onDeactivate={handleDeactivate}
			isAdmin={isAdmin}
			isPreceptor={isPreceptor}
		/>
	);
}
