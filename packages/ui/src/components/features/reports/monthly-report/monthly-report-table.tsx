'use client';

import type { MonthlyReportStudent } from '@repo/common';
import type { ColumnDef } from '@tanstack/react-table';
import { formatPercent } from '../../../../lib/format';
import { getAbsencePercentTone } from '../../../../lib/report-format';
import { DataTable } from '../../../shared/data-table/data-table';
import { ReportStatusCell } from './report-status-cell';

export interface MonthlyReportTableProps {
	students: MonthlyReportStudent[];
	isLoading?: boolean;
}

const columns: ColumnDef<MonthlyReportStudent>[] = [
	{
		accessorKey: 'fullName',
		header: 'Estudiante',
		cell: ({ row }) => (
			<span className="font-medium">{row.getValue('fullName')}</span>
		),
	},
	{
		accessorKey: 'documentNumber',
		header: 'DNI',
		cell: ({ row }) => (
			<span className="font-mono text-xs text-muted-foreground">
				{row.getValue('documentNumber')}
			</span>
		),
	},
	{
		accessorKey: 'present',
		header: 'Presentes',
		cell: ({ row }) => (
			<span className="block text-center tabular-nums">
				{row.getValue('present')}
			</span>
		),
	},
	{
		accessorKey: 'absent',
		header: 'Ausentes',
		cell: ({ row }) => (
			<span className="block text-center tabular-nums">
				{row.getValue('absent')}
			</span>
		),
	},
	{
		accessorKey: 'late',
		header: 'Tardanzas',
		cell: ({ row }) => (
			<span className="block text-center tabular-nums">
				{row.getValue('late')}
			</span>
		),
	},
	{
		accessorKey: 'justified',
		header: 'Justificadas',
		cell: ({ row }) => (
			<span className="block text-center tabular-nums">
				{row.getValue('justified')}
			</span>
		),
	},
	{
		accessorKey: 'absencePercent',
		header: '% Inasistencia',
		cell: ({ row }) => {
			const value = row.getValue<number>('absencePercent');
			return (
				<span
					className={`block text-center font-semibold tabular-nums ${getAbsencePercentTone(value)}`}
				>
					{formatPercent(value)}
				</span>
			);
		},
	},
	{
		id: 'estado',
		header: 'Estado',
		enableSorting: false,
		cell: ({ row }) => (
			<ReportStatusCell
				status={row.original.status}
				absencePercent={row.original.absencePercent}
				alerts={row.original.alerts}
			/>
		),
	},
];

export function MonthlyReportTable({
	students,
	isLoading,
}: MonthlyReportTableProps) {
	return (
		<DataTable
			columns={columns}
			data={students}
			isLoading={isLoading}
			pagination={{ pageSize: 15 }}
			emptyMessage="Sin alumnos registrados en este curso"
		/>
	);
}
