'use client';

/**
 * Demo dashboard — the real product dashboard per role.
 *
 * Replaces the T3 welcome placeholder: branches on the demo session role and
 * composes the product dashboard panels from packages/ui, fed by the demo
 * store selectors (getDashboardMetrics, getPreceptorDashboard,
 * getSuperAdminAnalytics, getCourseSnapshots) instead of the network hooks
 * the client page uses.
 *
 * Route guard note: the demo shell deliberately permits teachers on
 * /dashboard so the complete four-role demo matrix is reachable. Production
 * still redirects teachers from /dashboard to their subjects.
 */

import { getDashboardConfig } from '@/lib/dashboard/dashboard-config';
import { useDemo } from '@/lib/session/demo-provider';
import { ROLE_LABELS } from '@/lib/session/helpers';
import { DEMO_TODAY } from '@/lib/store/types';
import { APP_ROUTES, ROLES } from '@repo/common';
import {
	AttendanceTrendChart,
	CoursesOverview,
	DashboardMetricsSection,
	PageHeader,
	PreceptorDashboard,
	SuperAdminDashboard,
} from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

/**
 * Fake the client's refetch feedback — the demo store is synchronous and has
 * nothing to reload, so the refresh buttons just spin briefly.
 */
function useSimulatedRefresh(delayMs = 600) {
	const [isRefreshing, setIsRefreshing] = useState(false);

	useEffect(() => {
		if (!isRefreshing) return;
		const timer = window.setTimeout(() => setIsRefreshing(false), delayMs);
		return () => window.clearTimeout(timer);
	}, [isRefreshing, delayMs]);

	const refresh = useCallback(() => setIsRefreshing(true), []);

	return { isRefreshing, refresh };
}

export default function DashboardPage() {
	const { state, session, selectors } = useDemo();
	const { isRefreshing, refresh } = useSimulatedRefresh();
	const router = useRouter();

	const handleManageTenants = useCallback(() => {
		router.push(APP_ROUTES.tenants);
	}, [router]);
	const handleCourseClick = useCallback(
		(courseId: string) => {
			router.push(
				`${APP_ROUTES.attendanceDaily}?courseId=${courseId}&date=${DEMO_TODAY}`,
			);
		},
		[router],
	);

	const user = session.user;
	if (!user) return null;

	const config = getDashboardConfig(user.role);

	if (config.view === 'superadmin-analytics') {
		return (
			<SuperAdminDashboard
				data={selectors.getSuperAdminAnalytics(state)}
				isLoading={false}
				isError={false}
				isRefreshing={isRefreshing}
				onRefresh={refresh}
				onRetry={refresh}
				onManageTenants={handleManageTenants}
			/>
		);
	}

	if (config.view === 'preceptor-panel') {
		const preceptorDashboard =
			user.role === ROLES.PRECEPTOR
				? selectors.getPreceptorDashboard(state, user.id)
				: null;
		const ownCourseIds = preceptorDashboard?.courses.map(
			(course) => course.courseId,
		);
		const metricsCourseIds =
			config.metricsScope === 'own' ? ownCourseIds : undefined;
		const courses =
			config.coursesScope === 'school'
				? selectors.getCourseSnapshots(state)
				: (preceptorDashboard?.courses ?? []);

		return (
			<PreceptorDashboard
				preceptorName={user.firstName}
				role={user.role}
				tenantName={session.tenant?.name}
				courses={courses}
				metrics={selectors.getDashboardMetrics(state, metricsCourseIds)}
				isLoadingCourses={false}
				isLoadingMetrics={false}
				isRefreshing={isRefreshing}
				onRefresh={refresh}
				onCourseClick={handleCourseClick}
			/>
		);
	}

	// Teacher panel: courses that host the teacher's subjects, scoped metrics.
	const ownCourseIds = [
		...new Set(
			selectors
				.getTeacherSubjects(state, user.id)
				.map((subject) => subject.courseId)
				.filter((courseId): courseId is string => Boolean(courseId)),
		),
	];
	const metrics =
		config.metricsScope === 'own'
			? selectors.getDashboardMetrics(state, ownCourseIds)
			: selectors.getDashboardMetrics(state);

	return (
		<div className="space-y-6">
			<PageHeader
				title={config.headerTitle}
				subtitle={`${ROLE_LABELS[user.role]} · ${config.headerSubtitle}`}
			/>
			<DashboardMetricsSection metrics={metrics} />
			<CoursesOverview
				courses={selectors.getCourseSnapshots(state, ownCourseIds)}
			/>
			<AttendanceTrendChart trend={metrics.weeklyTrend} />
		</div>
	);
}
