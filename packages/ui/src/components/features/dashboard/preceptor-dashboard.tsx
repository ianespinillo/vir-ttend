'use client';

import type { CourseSnapshot, DashboardMetrics } from '@repo/common';
import { Skeleton } from '../../../ui/skeleton';
import { AttendanceTrendChart } from './attendance-trend-chart';
import { CoursesOverview } from './courses-overview';
import { DashboardHeader } from './dashboard-header';
import { DashboardMetricsSection } from './dashboard-metrics';

export interface PreceptorDashboardProps {
	preceptorName: string;
	courses: CourseSnapshot[];
	metrics: DashboardMetrics | null;
	isLoadingCourses?: boolean;
	isLoadingMetrics?: boolean;
	isRefreshing?: boolean;
	onRefresh?: () => void;
	onCourseClick?: (courseId: string) => void;
}

export function PreceptorDashboard({
	preceptorName,
	courses,
	metrics,
	isLoadingCourses,
	isLoadingMetrics,
	isRefreshing,
	onRefresh,
	onCourseClick,
}: Readonly<PreceptorDashboardProps>) {
	return (
		<div className="space-y-6">
			<DashboardHeader
				preceptorName={preceptorName}
				isRefreshing={isRefreshing}
				onRefresh={onRefresh}
			/>

			<DashboardMetricsSection metrics={metrics} isLoading={isLoadingMetrics} />

			{isLoadingCourses ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<div key={i} className="rounded-lg border bg-card p-4 shadow-sm">
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-center gap-3">
									<Skeleton className="h-5 w-5 rounded-full" />
									<div>
										<Skeleton className="h-4 w-32 mb-1" />
										<Skeleton className="h-3 w-20" />
									</div>
								</div>
								<Skeleton className="h-6 w-12" />
							</div>
							<div className="mt-3 grid grid-cols-4 gap-2">
								{[1, 2, 3, 4].map((j) => (
									<div key={j} className="text-center">
										<Skeleton className="h-4 w-8 mx-auto mb-1" />
										<Skeleton className="h-3 w-12 mx-auto" />
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			) : (
				<CoursesOverview courses={courses} onCourseClick={onCourseClick} />
			)}

			{metrics && (
				<AttendanceTrendChart
					trend={metrics.weeklyTrend}
					isLoading={isLoadingMetrics}
				/>
			)}
		</div>
	);
}
