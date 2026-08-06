'use client';

import type { ICourseResponse, IStudentResponse } from '@repo/common';
import type { ColumnDef } from '@tanstack/react-table';
import {
	Eye,
	MoreHorizontal,
	UserCheck,
	UserMinus,
	UserPlus,
} from 'lucide-react';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '../../../ui/dropdown-menu';
import { DataTable } from '../../shared/data-table';

export interface StudentsTableProps {
	data: IStudentResponse[];
	isLoading?: boolean;
	courses?: ICourseResponse[];
	onView?: (id: string) => void;
	onEdit?: (id: string) => void;
	onEnroll?: (student: IStudentResponse) => void;
	onTransfer?: (student: IStudentResponse) => void;
	onDeactivate?: (student: IStudentResponse) => void;
	isAdmin?: boolean;
	isPreceptor?: boolean;
}

export function StudentsTable({
	data,
	isLoading = false,
	courses = [],
	onView,
	onEdit,
	onEnroll,
	onTransfer,
	onDeactivate,
	isAdmin = false,
	isPreceptor = false,
}: StudentsTableProps) {
	const courseMap = new Map(courses.map((c) => [c.id, c]));

	const columns: ColumnDef<IStudentResponse>[] = [
		{
			accessorKey: 'lastName',
			header: 'Apellido y Nombre',
			cell: ({ row }) => {
				const student = row.original;
				return (
					<div className="flex flex-col">
						<span className="font-medium text-foreground">
							{student.lastName}, {student.firstName}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: 'documentNumber',
			header: 'Documento / DNI',
			cell: ({ row }) => (
				<span className="font-mono text-sm">{row.original.documentNumber}</span>
			),
		},
		{
			accessorKey: 'courseId',
			header: 'Curso',
			cell: ({ row }) => {
				const student = row.original;
				if (student.courseName) return student.courseName;
				const course = courseMap.get(student.courseId);
				if (course) {
					return (
						course.fullName ||
						`${course.yearNumber}° ${course.division} (${course.level})`
					);
				}
				return '—';
			},
		},
		{
			accessorKey: 'status',
			header: 'Estado',
			cell: ({ row }) => {
				const status = row.original.status;
				if (status === 'ACTIVE') {
					return (
						<Badge
							variant="outline"
							className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
						>
							Activo
						</Badge>
					);
				}
				if (status === 'TRANSFERRED') {
					return (
						<Badge
							variant="outline"
							className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
						>
							Transferido
						</Badge>
					);
				}
				return (
					<Badge
						variant="outline"
						className="bg-muted text-muted-foreground border-border"
					>
						Inactivo
					</Badge>
				);
			},
		},
		{
			id: 'actions',
			header: 'Acciones',
			cell: ({ row }) => {
				const student = row.original;

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">Abrir menú</span>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>Acciones</DropdownMenuLabel>
							{onView && (
								<DropdownMenuItem onClick={() => onView(student.id)}>
									<Eye className="mr-2 h-4 w-4" />
									Ver Detalle
								</DropdownMenuItem>
							)}

							{(isAdmin || isPreceptor) && onEdit && (
								<DropdownMenuItem onClick={() => onEdit(student.id)}>
									<UserCheck className="mr-2 h-4 w-4" />
									Editar
								</DropdownMenuItem>
							)}

							{isAdmin && (
								<>
									<DropdownMenuSeparator />
									{onEnroll && (
										<DropdownMenuItem onClick={() => onEnroll(student)}>
											<UserPlus className="mr-2 h-4 w-4" />
											Matricular
										</DropdownMenuItem>
									)}
									{onTransfer && (
										<DropdownMenuItem onClick={() => onTransfer(student)}>
											<UserPlus className="mr-2 h-4 w-4" />
											Transferir
										</DropdownMenuItem>
									)}
									{onDeactivate && student.status === 'ACTIVE' && (
										<DropdownMenuItem
											onClick={() => onDeactivate(student)}
											className="text-destructive focus:text-destructive"
										>
											<UserMinus className="mr-2 h-4 w-4" />
											Desactivar
										</DropdownMenuItem>
									)}
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];

	return (
		<DataTable
			columns={columns}
			data={data}
			isLoading={isLoading}
			emptyMessage="No se encontraron estudiantes"
		/>
	);
}
