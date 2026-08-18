'use client';

import type { ICourseResponse } from '@repo/common';
import { GraduationCap } from 'lucide-react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../../ui/select';

export interface CourseSelectorProps {
	courses: ICourseResponse[];
	selectedCourseId?: string;
	onCourseChange: (courseId: string) => void;
	isLoading?: boolean;
	disabled?: boolean;
}

export function CourseSelector({
	courses,
	selectedCourseId,
	onCourseChange,
	isLoading,
	disabled,
}: CourseSelectorProps) {
	return (
		<div className="w-full sm:w-64">
			<Select
				value={selectedCourseId || ''}
				onValueChange={onCourseChange}
				disabled={disabled || isLoading}
			>
				<SelectTrigger className="w-full bg-background/50 border-input hover:border-primary/50 transition-colors">
					<div className="flex items-center gap-2 truncate">
						<GraduationCap className="h-4 w-4 text-primary shrink-0" />
						<SelectValue
							placeholder={isLoading ? 'Cargando cursos...' : 'Seleccionar curso...'}
						/>
					</div>
				</SelectTrigger>
				<SelectContent>
					{courses.map((course) => {
						const levelLabel =
							course.level === 'PRIMARY'
								? 'Primaria'
								: course.level === 'SECONDARY'
									? 'Secundaria'
									: 'Inicial';
						const label =
							course.fullName ||
							`${course.yearNumber}° "${course.division}" (${levelLabel})`;
						return (
							<SelectItem key={course.id} value={course.id}>
								<div className="flex items-center justify-between gap-4 w-full">
									<span className="font-medium">{label}</span>
									<span className="text-xs text-muted-foreground">
										{course.shift === 'MORNING'
											? 'Mañana'
											: course.shift === 'AFTERNOON'
												? 'Tarde'
												: 'Noche'}
									</span>
								</div>
							</SelectItem>
						);
					})}
				</SelectContent>
			</Select>
		</div>
	);
}
