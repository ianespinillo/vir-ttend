'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
	type ICourseResponse,
	enrollSchema,
	transferSchema,
} from '@repo/common';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
	mode: 'enroll' | 'transfer';
	courses: ICourseResponse[];
	onSubmit: (targetCourseId: string) => Promise<void> | void;
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
	const schema = mode === 'enroll' ? enrollSchema : transferSchema;

	const form = useForm<{ courseId?: string; targetCourseId?: string }>({
		resolver: zodResolver(schema),
		defaultValues: {
			courseId: mode === 'enroll' ? currentCourseId || '' : undefined,
			targetCourseId: mode === 'transfer' ? '' : undefined,
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({
				courseId: mode === 'enroll' ? currentCourseId || '' : undefined,
				targetCourseId: mode === 'transfer' ? '' : undefined,
			});
		}
	}, [open, mode, currentCourseId, form]);

	const handleSubmit = async (values: Record<string, string>) => {
		const targetId = values.targetCourseId || values.courseId || '';
		if (targetId) {
			await onSubmit(targetId);
			onOpenChange(false);
		}
	};

	const title =
		mode === 'enroll' ? 'Matricular Estudiante' : 'Transferir Estudiante';
	const description =
		mode === 'enroll'
			? `Selecciona el curso al que deseas matricular a ${studentName}.`
			: `Selecciona el nuevo curso al que deseas transferir a ${studentName}.`;

	const fieldName = mode === 'enroll' ? 'courseId' : 'targetCourseId';
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
							name={fieldName as 'courseId' | 'targetCourseId'}
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
													{course.fullName ||
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
								{isLoading
									? 'Guardando...'
									: mode === 'enroll'
										? 'Matricular'
										: 'Transferir'}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
