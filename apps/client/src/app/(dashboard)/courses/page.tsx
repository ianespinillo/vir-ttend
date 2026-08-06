'use client';

import {
	useAcademicYears,
	useActiveAcademicYear,
	useCourses,
} from '@repo/hooks';
import { CoursesList, PageHeader } from '@repo/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../../../lib/auth/provider';

export default function CoursesPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useAuth();

	const role = user?.role?.toLowerCase();
	const isAdmin = role === 'admin' || role === 'superadmin';
	const isPreceptor = role === 'preceptor';

	const { data: activeAY } = useActiveAcademicYear();
	const { data: academicYears } = useAcademicYears();

	const [selectedAYId, setSelectedAYId] = useState<string>(
		searchParams.get('academicYearId') || activeAY?.id || 'ALL',
	);

	const filterParams =
		selectedAYId && selectedAYId !== 'ALL'
			? { academicYearId: selectedAYId }
			: undefined;

	const { data: coursesData, isLoading } = useCourses(filterParams);
	const courses = coursesData || [];

	const handleAcademicYearChange = (ayId: string) => {
		setSelectedAYId(ayId);
	};

	const handleViewCourse = (id: string) => {
		router.push(`/courses/${id}`);
	};

	const handleEditCourse = (id: string) => {
		router.push(`/courses/${id}?edit=true`);
	};

	const handleCreateCourse = () => {
		router.push('/courses/create');
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title="Gestión de Cursos"
				description="Organización académica, asignación de preceptores y materias por división"
			/>

			<CoursesList
				courses={courses}
				academicYears={academicYears || []}
				selectedAcademicYearId={selectedAYId}
				onAcademicYearChange={handleAcademicYearChange}
				isLoading={isLoading}
				onViewCourse={handleViewCourse}
				onEditCourse={handleEditCourse}
				onCreateCourse={handleCreateCourse}
				canManage={isAdmin}
			/>
		</div>
	);
}
