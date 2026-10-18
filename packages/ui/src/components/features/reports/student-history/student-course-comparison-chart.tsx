'use client';

import type { CourseSummaryEntry, StudentMonthlyEntry } from '@repo/common';
import { TrendingUp } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { buildStudentCourseComparison } from '../../../../lib/student-history';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../ui/card';
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '../../../../ui/chart';
import { Skeleton } from '../../../../ui/skeleton';

const chartConfig = {
	alumno: {
		label: 'Alumno',
		color: 'hsl(var(--primary-ink))',
	},
	curso: {
		label: 'Promedio del curso',
		color: 'hsl(var(--muted-foreground))',
	},
} satisfies ChartConfig;

export interface StudentCourseComparisonChartProps {
	studentMonths: StudentMonthlyEntry[];
	courseMonths: CourseSummaryEntry[];
	isLoading?: boolean;
}

export function StudentCourseComparisonChart({
	studentMonths,
	courseMonths,
	isLoading,
}: StudentCourseComparisonChartProps) {
	const data = buildStudentCourseComparison(studentMonths, courseMonths);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<TrendingUp className="h-4 w-4 text-primary" />
					Alumno vs. curso
				</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<Skeleton className="h-64 w-full animate-pulse rounded-lg" />
				) : data.length === 0 ? (
					<p className="py-16 text-center text-sm text-muted-foreground">
						Aún no hay meses comparables
					</p>
				) : (
					<ChartContainer config={chartConfig} className="h-64 w-full">
						<LineChart data={data} margin={{ left: -12, right: 12 }}>
							<CartesianGrid vertical={false} strokeDasharray="3 3" />
							<XAxis
								dataKey="label"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
							/>
							<YAxis
								domain={[0, 100]}
								tickLine={false}
								axisLine={false}
								tickFormatter={(v) => `${v}%`}
							/>
							<ChartTooltip content={<ChartTooltipContent indicator="line" />} />
							<ChartLegend content={<ChartLegendContent />} />
							<Line
								dataKey="curso"
								type="monotone"
								stroke="var(--color-curso)"
								strokeWidth={2}
								strokeDasharray="4 4"
								dot={false}
							/>
							<Line
								dataKey="alumno"
								type="monotone"
								stroke="var(--color-alumno)"
								strokeWidth={2}
								dot={false}
							/>
						</LineChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	);
}
