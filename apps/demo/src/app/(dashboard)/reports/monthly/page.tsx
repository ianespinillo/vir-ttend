'use client';

import { getScopedCourseIds } from '@/lib/academic/academic-mappings';
import { useDemo } from '@/lib/session/demo-provider';
import type { ExportFormat } from '@repo/common';
import { MonthlyReport, PageHeader, sortPeriodsDesc } from '@repo/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function ReportsMonthlyPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { state, session, selectors } = useDemo();

	const user = session.user;

	// Scoped courses based on role
	const allCourses = selectors.getCourses(state);
	const allSubjects = selectors.getSubjects(state);
	const scopedCourseIds = getScopedCourseIds(
		allCourses,
		allSubjects,
		user?.id,
		user?.role,
	);
	const courses =
		scopedCourseIds === undefined
			? allCourses
			: allCourses.filter((course) => scopedCourseIds.includes(course.id));

	const initialCourseId = searchParams.get('courseId') || courses[0]?.id || '';
	const initialMonth = searchParams.get('month');
	const initialYear = searchParams.get('year');

	const [selectedCourseId, setSelectedCourseId] =
		useState<string>(initialCourseId);
	const [selectedPeriod, setSelectedPeriod] = useState<{
		month?: number;
		year?: number;
	}>({
		month: initialMonth ? Number(initialMonth) : undefined,
		year: initialYear ? Number(initialYear) : undefined,
	});

	const [pendingExport, setPendingExport] = useState<ExportFormat | null>(null);

	const courseId = selectedCourseId || undefined;
	const periods = courseId
		? selectors.getAvailableReportPeriods(state, courseId)
		: [];

	const updateUrl = useCallback(
		(newCourseId: string, period: { month?: number; year?: number }) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set('courseId', newCourseId);
			if (period.month && period.year) {
				params.set('month', String(period.month));
				params.set('year', String(period.year));
			} else {
				params.delete('month');
				params.delete('year');
			}
			router.replace(`/reports/monthly?${params.toString()}`);
		},
		[router, searchParams],
	);

	// Default to first course if none selected
	useEffect(() => {
		if (!selectedCourseId && courses.length > 0) {
			const firstCourse = courses[0];
			if (firstCourse) {
				setSelectedCourseId(firstCourse.id);
				updateUrl(firstCourse.id, selectedPeriod);
			}
		}
	}, [selectedCourseId, courses, selectedPeriod, updateUrl]);

	// Auto-select latest period if none selected
	useEffect(() => {
		if (
			courseId &&
			periods.length > 0 &&
			!(selectedPeriod.month && selectedPeriod.year)
		) {
			const latest = sortPeriodsDesc(periods)[0];
			if (latest) {
				setSelectedPeriod({ month: latest.month, year: latest.year });
				updateUrl(courseId, { month: latest.month, year: latest.year });
			}
		}
	}, [courseId, periods, selectedPeriod, updateUrl]);

	const month = selectedPeriod.month;
	const year = selectedPeriod.year;

	const report =
		courseId && month && year
			? selectors.getMonthlyReport(state, courseId, month, year)
			: null;

	const trendMonths = courseId
		? selectors.getCourseSummary(state, courseId)
		: [];

	const handleCourseChange = useCallback(
		(newCourseId: string) => {
			setSelectedCourseId(newCourseId);
			setSelectedPeriod({});
			updateUrl(newCourseId, {});
		},
		[updateUrl],
	);

	const handlePeriodChange = useCallback(
		(period: { month: number; year: number }) => {
			setSelectedPeriod(period);
			if (selectedCourseId) {
				updateUrl(selectedCourseId, period);
			}
		},
		[selectedCourseId, updateUrl],
	);

	const handleGenerate = useCallback(() => {
		if (!selectedCourseId) return;
		const latest = sortPeriodsDesc(periods)[0];
		const targetPeriod = latest ?? { month: 6, year: 2026 };
		setSelectedPeriod(targetPeriod);
		updateUrl(selectedCourseId, targetPeriod);
	}, [selectedCourseId, periods, updateUrl]);

	const handleExport = useCallback((format: ExportFormat) => {
		setPendingExport(format);
		setTimeout(() => {
			setPendingExport(null);
		}, 400);
	}, []);

	return (
		<div className="space-y-6">
			<PageHeader title="Reportes" description="Asistencia mensual por curso" />

			<MonthlyReport
				filters={{
					courseId: selectedCourseId || undefined,
					month,
					year,
				}}
				onCourseChange={handleCourseChange}
				onPeriodChange={handlePeriodChange}
				courses={courses}
				periods={periods}
				report={report}
				trendMonths={trendMonths}
				isLoadingCourses={false}
				isLoadingPeriods={false}
				isLoadingReport={false}
				isLoadingTrend={false}
				onGenerate={handleGenerate}
				isGenerating={false}
				onExport={handleExport}
				pendingExport={pendingExport}
			/>
		</div>
	);
}
