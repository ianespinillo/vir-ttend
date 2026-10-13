'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type ICourseResponse, enrollSchema } from '@repo/common';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { localizeCourseName } from '../../../lib/shift';
import { Button } from '../../../ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '../../../ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../../../ui/form';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../ui/select';

export interface EnrollmentModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	studentName: string;
	currentCourseId?: string;
	/** 'enroll' = asignar curso a un alumno sin curso; 'change' = cambiar de curso (el alumno permanece activo). */
	mode: 'enroll' | 'change';
	courses: ICourseResponse[];
	onSubmit: (courseId: string) => void;
	isLoading?: boolean;
}

export function EnrollmentModal({
	open,
	onOpenChange,
	studentName,
	currentCourseId,
	mode,
	courses,
	onSubmit,
	isLoading = false,
}: EnrollmentModalProps) {
	const form = useForm({
		resolver: zodResolver(enrollSchema),
		defaultValues: { courseId: '' },
	});

	useEffect(() => {
		if (open) {
			form.reset({ courseId: '' });
		}
	}, [open, form]);

	const handleSubmit = (values: { courseId: string }) => {
		onSubmit(values.courseId);
	};

	const isChange = mode === 'change';
	const title = isChange ? 'Cambiar de Curso' : 'Matricular Estudiante';
	const description = isChange
		? `Selecciona el nuevo curso para ${studentName}. El alumno permanecerá activo.`
		: `Selecciona el curso al que deseas matricular a ${studentName}.`;
	const submitLabel = isChange ? 'Cambiar de curso' : 'Matricular';

	const availableCourses = courses.filter((c) => c.id !== currentCourseId);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-4 pt-2"
					>
						<FormField
							control={form.control}
							name="courseId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Curso de destino</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
										value={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleccionar curso" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{availableCourses.map((course) => (
												<SelectItem key={course.id} value={course.id}>
													{localizeCourseName(course.fullName) ||
														`${course.yearNumber}° ${course.division} (${course.level})`}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter className="gap-2 sm:gap-0 pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isLoading}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? 'Guardando...' : submitLabel}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
