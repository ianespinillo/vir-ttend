'use client';

import type { CourseSnapshot } from '@repo/common';
import { EmptyState } from '../../shared/empty-state';
import { CourseStatusCard } from './course-status-card';

export interface CoursesOverviewProps {
	courses: CourseSnapshot[];
	onCourseClick?: (courseId: string) => void;
}

export function CoursesOverview({
	courses,
	onCourseClick,
}: Readonly<CoursesOverviewProps>) {
	if (!courses || courses.length === 0) {
		return (
			<EmptyState
				title="Sin cursos"
				description="No hay cursos asignados para mostrar en el dashboard."
			/>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{courses.map((course) => (
				<CourseStatusCard
					key={course.courseId}
					course={course}
					onClick={onCourseClick}
				/>
			))}
		</div>
	);
}
