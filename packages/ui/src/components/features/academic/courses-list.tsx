'use client';

import type { IAcademicYearResponse, ICourseResponse } from '@repo/common';
import { Filter, Plus, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../ui/select';
import { EmptyState } from '../../shared/empty-state';
import { LoadingSpinner } from '../../shared/loading-spinner';
import { CourseCard } from './course-card';

export interface CoursesListProps {
	courses: ICourseResponse[];
	academicYears?: IAcademicYearResponse[];
	selectedAcademicYearId?: string;
	onAcademicYearChange?: (id: string) => void;
	isLoading?: boolean;
	onViewCourse?: (id: string) => void;
	onEditCourse?: (id: string) => void;
	onCreateCourse?: () => void;
	canManage?: boolean;
}

export function CoursesList({
	courses,
	academicYears = [],
	selectedAcademicYearId,
	onAcademicYearChange,
	isLoading = false,
	onViewCourse,
	onEditCourse,
	onCreateCourse,
	canManage = false,
}: CoursesListProps) {
	const [search, setSearch] = useState('');
	const [levelFilter, setLevelFilter] = useState<string>('ALL');
	const [shiftFilter, setShiftFilter] = useState<string>('ALL');

	const filteredCourses = courses.filter((c) => {
		const matchesSearch =
			!search ||
			c.fullName.toLowerCase().includes(search.toLowerCase()) ||
			c.division.toLowerCase().includes(search.toLowerCase()) ||
			c.preceptorName?.toLowerCase().includes(search.toLowerCase());

		const matchesLevel =
			levelFilter === 'ALL' ||
			c.level === levelFilter ||
			(levelFilter === 'SECONDARY' && c.level === 'SEONDARY');

		const matchesShift = shiftFilter === 'ALL' || c.shift === shiftFilter;

		return matchesSearch && matchesLevel && matchesShift;
	});

	const hasActiveFilters =
		search !== '' || levelFilter !== 'ALL' || shiftFilter !== 'ALL';

	const handleClearFilters = () => {
		setSearch('');
		setLevelFilter('ALL');
		setShiftFilter('ALL');
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-lg border shadow-sm">
				<div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full">
					<div className="relative w-full sm:w-64">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Buscar curso o preceptor..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9 w-full"
						/>
					</div>

					{academicYears.length > 0 && onAcademicYearChange && (
						<div className="w-full sm:w-48">
							<Select
								value={selectedAcademicYearId || 'ALL'}
								onValueChange={onAcademicYearChange}
							>
								<SelectTrigger>
									<SelectValue placeholder="Ciclo lectivo" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">Todos los ciclos</SelectItem>
									{academicYears.map((ay) => (
										<SelectItem key={ay.id} value={ay.id}>
											Año Lectivo {ay.year} {ay.isActive ? '(Activo)' : ''}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					<div className="w-full sm:w-44">
						<Select value={levelFilter} onValueChange={setLevelFilter}>
							<SelectTrigger>
								<SelectValue placeholder="Nivel" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="ALL">Todos los niveles</SelectItem>
								<SelectItem value="SECONDARY">Secundaria</SelectItem>
								<SelectItem value="PRIMARY">Primaria</SelectItem>
								<SelectItem value="DEFAULT">Inicial / Otro</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="w-full sm:w-40">
						<Select value={shiftFilter} onValueChange={setShiftFilter}>
							<SelectTrigger>
								<SelectValue placeholder="Turno" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="ALL">Todos los turnos</SelectItem>
								<SelectItem value="MORNING">Mañana</SelectItem>
								<SelectItem value="AFTERNOON">Tarde</SelectItem>
								<SelectItem value="EVENING">Noche</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
					{hasActiveFilters && (
						<Button
							variant="ghost"
							size="sm"
							onClick={handleClearFilters}
							className="text-muted-foreground"
						>
							<X className="h-4 w-4 mr-1" />
							Limpiar
						</Button>
					)}
					{canManage && onCreateCourse && (
						<Button onClick={onCreateCourse} className="gap-2">
							<Plus className="h-4 w-4" />
							Nuevo Curso
						</Button>
					)}
				</div>
			</div>

			{isLoading ? (
				<div className="flex h-64 items-center justify-center">
					<LoadingSpinner />
				</div>
			) : filteredCourses.length === 0 ? (
				<EmptyState
					title="No se encontraron cursos"
					description={
						hasActiveFilters
							? 'Pruebe cambiar o limpiar los filtros seleccionados.'
							: 'No hay cursos registrados para este ciclo lectivo.'
					}
					actionLabel={canManage && onCreateCourse ? 'Crear Curso' : undefined}
					onAction={canManage ? onCreateCourse : undefined}
				/>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredCourses.map((course) => (
						<CourseCard
							key={course.id}
							course={course}
							onView={onViewCourse}
							onEdit={onEditCourse}
							canManage={canManage}
						/>
					))}
				</div>
			)}
		</div>
	);
}
