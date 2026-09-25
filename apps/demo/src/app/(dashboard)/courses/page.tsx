'use client';

import {
	DEMO_COURSE_ROUTES,
	getScopedCourseIds,
} from '@/lib/academic/academic-mappings';
import { useDemo } from '@/lib/session/demo-provider';
import { ACADEMIC_ROUTES, ROLES } from '@repo/common';
import { CoursesList, PageHeader } from '@repo/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function CoursesPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { state, session, selectors } = useDemo();
	const [selectedAcademicYearId, setSelectedAcademicYearId] = useState(
		searchParams.get('academicYearId') || 'ALL',
	);

	const user = session.user;
	const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPERADMIN;
	const allCourses = selectors.getCourses(state);
	const allSubjects = selectors.getSubjects(state);
	const courseIds = getScopedCourseIds(
		allCourses,
		allSubjects,
		user?.id,
		user?.role,
	);
	const courses = selectors
		.getCourses(state, courseIds)
		.filter(
			(course) =>
				selectedAcademicYearId === 'ALL' ||
				course.academicYearId === selectedAcademicYearId,
		);
	const academicYears = selectors.getAcademicYears(state);

	return (
		<div className="space-y-6">
			<PageHeader
				title="Gestión de Cursos"
				description="Organización académica, asignación de preceptores y materias por división"
			/>

			<CoursesList
				courses={courses}
				academicYears={academicYears}
				selectedAcademicYearId={selectedAcademicYearId}
				onAcademicYearChange={setSelectedAcademicYearId}
				isLoading={false}
				onViewCourse={(id) => router.push(ACADEMIC_ROUTES.course(id))}
				onEditCourse={(id) => router.push(DEMO_COURSE_ROUTES.edit(id))}
				onCreateCourse={() => router.push(DEMO_COURSE_ROUTES.new)}
				canManage={isAdmin}
			/>
		</div>
	);
}
