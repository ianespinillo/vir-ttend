'use client';

import {
	type ColumnDef,
	type SortingState,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { Skeleton } from '../../../ui/skeleton';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '../../../ui/table';
import { DataTablePagination } from './data-table-pagination';

interface DataTableProps<TData> {
	columns: ColumnDef<TData>[];
	data: TData[];
	isLoading?: boolean;
	pagination?: { pageSize?: number };
	emptyMessage?: string;
}

export function DataTable<TData>({
	columns,
	data,
	isLoading = false,
	pagination,
	emptyMessage = 'No hay registros',
}: DataTableProps<TData>) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const pageSize = pagination?.pageSize ?? 10;

	const table = useReactTable({
		data,
		columns,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: { pagination: { pageSize } },
	});

	const { rows } = table.getRowModel();

	return (
		<div className="flex flex-col gap-4">
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{isLoading ? (
							Array.from({ length: 5 }, (_, rowIndex) => `skeleton-${rowIndex}`).map(
								(key) => (
									<TableRow key={key}>
										{columns.map((column, colIndex) => (
											<TableCell key={`${column.id ?? colIndex}`}>
												<Skeleton className="h-4 w-full" />
											</TableCell>
										))}
									</TableRow>
								),
							)
						) : rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center text-muted-foreground"
								>
									{emptyMessage}
								</TableCell>
							</TableRow>
						) : (
							rows.map((row) => (
								<TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
			{pagination && <DataTablePagination table={table} />}
		</div>
	);
}
