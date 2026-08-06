'use client';

import type { ICourseResponse } from '@repo/common';
import { Filter, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../ui/select';

export interface StudentFiltersState {
	search?: string;
	courseId?: string;
	status?: string;
}

export interface StudentFiltersProps {
	value: StudentFiltersState;
	onChange: (filters: StudentFiltersState) => void;
	courses: ICourseResponse[];
}

export function StudentFilters({
	value,
	onChange,
	courses,
}: StudentFiltersProps) {
	const [searchInput, setSearchInput] = useState(value.search || '');

	// Debounce input search by 300ms
	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchInput !== (value.search || '')) {
				onChange({ ...value, search: searchInput || undefined });
			}
		}, 300);
		return () => clearTimeout(timer);
	}, [searchInput, value, onChange]);

	// Sync local search input if value.search changes from outside
	useEffect(() => {
		setSearchInput(value.search || '');
	}, [value.search]);

	const handleCourseChange = (courseId: string) => {
		onChange({
			...value,
			courseId: courseId === 'ALL' ? undefined : courseId,
		});
	};

	const handleStatusChange = (status: string) => {
		onChange({
			...value,
			status: status === 'ALL' ? undefined : status,
		});
	};

	const hasActiveFilters = Boolean(
		value.search || value.courseId || value.status,
	);

	const handleClear = () => {
		setSearchInput('');
		onChange({});
	};

	return (
		<div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-lg border shadow-sm">
			<div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full">
				<div className="relative w-full sm:w-72">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Buscar por nombre o DNI..."
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						className="pl-9 w-full"
					/>
				</div>

				<div className="w-full sm:w-48">
					<Select value={value.courseId || 'ALL'} onValueChange={handleCourseChange}>
						<SelectTrigger>
							<SelectValue placeholder="Todos los cursos" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">Todos los cursos</SelectItem>
							{courses.map((course) => (
								<SelectItem key={course.id} value={course.id}>
									{course.fullName ||
										`${course.yearNumber}° ${course.division} (${course.level})`}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="w-full sm:w-44">
					<Select value={value.status || 'ALL'} onValueChange={handleStatusChange}>
						<SelectTrigger>
							<SelectValue placeholder="Todos los estados" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">Todos los estados</SelectItem>
							<SelectItem value="ACTIVE">Activo</SelectItem>
							<SelectItem value="INACTIVE">Inactivo</SelectItem>
							<SelectItem value="TRANSFERRED">Transferido</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{hasActiveFilters && (
				<Button
					variant="ghost"
					size="sm"
					onClick={handleClear}
					className="text-muted-foreground hover:text-foreground self-end sm:self-auto"
				>
					<X className="h-4 w-4 mr-1" />
					Limpiar filtros
				</Button>
			)}
		</div>
	);
}
