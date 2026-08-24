'use client';

import type { StudentMonthlyEntry } from '@repo/common';
import { formatMonthLabel, formatPercent } from '../../../../lib/format';
import { getAttendanceBarTone } from '../../../../lib/report-format';

export interface MonthlyProgressBarsProps {
	entries: StudentMonthlyEntry[];
}

export function MonthlyProgressBars({ entries }: MonthlyProgressBarsProps) {
	const sorted = [...entries].sort(
		(a, b) => b.year - a.year || b.month - a.month,
	);

	if (sorted.length === 0) {
		return (
			<p className="py-8 text-center text-sm text-muted-foreground">
				Sin meses generados todavía
			</p>
		);
	}

	return (
		<div className="space-y-3">
			{sorted.map((entry) => {
				const attendance = Math.min(100, Math.max(0, 100 - entry.absencePercent));

				return (
					<div
						key={`${entry.year}-${entry.month}`}
						className="flex items-center gap-3"
					>
						<span className="w-28 shrink-0 truncate text-sm text-muted-foreground">
							{formatMonthLabel(entry.month)} {entry.year}
						</span>
						<div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
							<div
								className={`h-full rounded-full transition-all ${getAttendanceBarTone(entry.absencePercent)}`}
								style={{ width: `${attendance}%` }}
							/>
						</div>
						<span className="w-14 shrink-0 text-right text-sm font-medium tabular-nums">
							{formatPercent(attendance)}
						</span>
					</div>
				);
			})}
		</div>
	);
}
