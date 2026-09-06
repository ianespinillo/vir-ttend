'use client';

import { LEVEL, LevelType } from '@repo/common';
import {
	useAcademicYears,
	useActiveAcademicYear,
	useCourses,
	useCurrentUser,
} from '@repo/hooks';
import { CoursesList, PageHeader } from '@repo/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function CoursesPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { data: user } = useCurrentUser();

	const role = user?.role.toLowerCase();
	const isAdmin = role === 'admin' || role === 'superadmin';
	const isPreceptor = role === 'preceptor';

	const { data: activeAY } = useActiveAcademicYear();
	const { data: academicYears } = useAcademicYears();

	const [selectedAYId, setSelectedAYId] = useState<string>(
		searchParams.get('academicYearId') || activeAY?.id || 'ALL',
	);
	const [selectedLevel, setSelectedLevel] = useState<LevelType>(
		(searchParams.get('level') as LevelType) || LEVEL.DEFAULT,
	);
	const filterParams =
		selectedAYId && selectedAYId !== 'ALL'
			? { academicYearId: selectedAYId, level: selectedLevel }
			: undefined;

	const { data: coursesData, isLoading } = useCourses(filterParams);
	const courses = coursesData || [];

	const handleAcademicYearChange = (ayId: string) => {
		setSelectedAYId(ayId);
	};
	const handleLevelChange = (level: LevelType) => {
		setSelectedLevel(level);
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
