'use client';

import type { AvailableReportPeriod, ICourseResponse } from '@repo/common';
import { CalendarRange } from 'lucide-react';
import { formatMonthLabel } from '../../../../lib/format';
import { sortPeriodsDesc } from '../../../../lib/report-format';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../../ui/select';
import { CourseSelector } from '../../attendance';

export interface ReportFiltersState {
	courseId?: string;
	month?: number;
	year?: number;
}

export interface ReportFiltersProps {
	courses: ICourseResponse[];
	periods: AvailableReportPeriod[];
	value: ReportFiltersState;
	onCourseChange: (courseId: string) => void;
	onPeriodChange: (period: { month: number; year: number }) => void;
	isLoadingCourses?: boolean;
	isLoadingPeriods?: boolean;
}

export function ReportFilters({
	courses,
	periods,
	value,
	onCourseChange,
	onPeriodChange,
	isLoadingCourses,
	isLoadingPeriods,
}: ReportFiltersProps) {
	const sortedPeriods = sortPeriodsDesc(periods);
	const selectedPeriod =
		value.month && value.year ? `${value.year}-${value.month}` : '';

	return (
		<div className="flex flex-col gap-3 sm:flex-row">
			<CourseSelector
				courses={courses}
				selectedCourseId={value.courseId}
				onCourseChange={onCourseChange}
				isLoading={isLoadingCourses}
			/>
			<Select
				value={selectedPeriod}
				onValueChange={(v) => {
					const [yearStr, monthStr] = v.split('-');
					onPeriodChange({
						month: Number(monthStr),
						year: Number(yearStr),
					});
				}}
				disabled={isLoadingPeriods || !value.courseId || sortedPeriods.length === 0}
			>
				<SelectTrigger className="w-full bg-background/50 border-input hover:border-primary/50 transition-colors sm:w-56">
					<div className="flex items-center gap-2 truncate">
						<CalendarRange className="h-4 w-4 text-primary shrink-0" />
						<SelectValue
							placeholder={
								isLoadingPeriods ? 'Cargando períodos...' : 'Seleccionar mes...'
							}
						/>
					</div>
				</SelectTrigger>
				<SelectContent>
					{sortedPeriods.map((period) => (
						<SelectItem
							key={`${period.year}-${period.month}`}
							value={`${period.year}-${period.month}`}
						>
							{formatMonthLabel(period.month)} {period.year}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
