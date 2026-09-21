'use client';

import { useAuth } from '@/lib/auth/provider';
import { APP_ROUTES, ROLES, type Roles } from '@repo/common';
import {
	useActiveAcademicYear,
	useDashboardMetrics,
	usePreceptorDashboard,
	useSuperAdminAnalytics,
} from '@repo/hooks';
import { PreceptorDashboard, SuperAdminDashboard } from '@repo/ui';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';

const HOME_BY_ROLE: Record<Roles, string> = {
	[ROLES.SUPERADMIN]: APP_ROUTES.dashboard,
	[ROLES.ADMIN]: APP_ROUTES.dashboard,
	[ROLES.PRECEPTOR]: APP_ROUTES.dashboard,
	[ROLES.TEACHER]: APP_ROUTES.attendanceSubject,
};

function PreceptorDashboardRoute() {
	const router = useRouter();
	const { user } = useAuth();

	const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

	const { data: activeYear } = useActiveAcademicYear();

	const {
		data: dashboard,
		isLoading: isLoadingCourses,
		isRefetching,
		refetch,
	} = usePreceptorDashboard(today);

	const { data: metrics, isLoading: isLoadingMetrics } = useDashboardMetrics(
		activeYear?.id,
	);

	const handleRefresh = useCallback(() => {
		refetch();
	}, [refetch]);

	const handleCourseClick = useCallback(
		(courseId: string) => {
			router.push(
				`${APP_ROUTES.attendanceDaily}?courseId=${courseId}&date=${today}`,
			);
		},
		[router, today],
	);

	if (!user) return null;

	return (
		<PreceptorDashboard
			preceptorName={user.firstName}
			role={user.role}
			tenantName={user.tenantName}
			courses={dashboard?.courses ?? []}
			metrics={metrics ?? null}
			isLoadingCourses={isLoadingCourses}
			isLoadingMetrics={isLoadingMetrics}
			isRefreshing={isRefetching}
			onRefresh={handleRefresh}
			onCourseClick={handleCourseClick}
		/>
	);
}

function SuperAdminDashboardRoute() {
	const router = useRouter();

	const {
		data: analytics,
		isLoading,
		isError,
		isRefetching,
		refetch,
	} = useSuperAdminAnalytics();

	const handleManageTenants = useCallback(() => {
		router.push(APP_ROUTES.tenants);
	}, [router]);

	return (
		<SuperAdminDashboard
			data={analytics ?? null}
			isLoading={isLoading}
			isError={isError}
			isRefreshing={isRefetching}
			onRefresh={() => refetch()}
			onRetry={() => refetch()}
			onManageTenants={handleManageTenants}
		/>
	);
}

export default function DashboardPage() {
	const { user } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (user && user.role !== ROLES.ADMIN && user.role !== ROLES.PRECEPTOR) {
			const target = HOME_BY_ROLE[user.role];
			if (target && target !== APP_ROUTES.dashboard) {
				router.replace(target);
			}
		}
	}, [user, router]);

	if (!user) return null;

	if (user.role === ROLES.SUPERADMIN) {
		return <SuperAdminDashboardRoute />;
	}

	if (user.role === ROLES.TEACHER) {
		return null;
	}

	return <PreceptorDashboardRoute />;
}
