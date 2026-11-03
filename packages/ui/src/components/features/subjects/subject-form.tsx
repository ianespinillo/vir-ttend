'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
	COMMISSION_NUMBERS,
	type CommissionNumber,
	type CreateSubjectFormValues,
	type IUserResponse,
	SUBJECT_KIND,
	type SubjectTeacherFormValue,
	createSubjectSchema,
} from '@repo/common';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../../../ui/form';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { RadioGroup, RadioGroupItem } from '../../../ui/radio-group';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../ui/select';

interface TeacherChoice {
	teacherId: string;
	teacherName: string;
}

type TeacherMode = 'SAME' | 'PER_COMMISSION';

const NO_TEACHER: TeacherChoice = { teacherId: '', teacherName: '' };

/** Drops the manual name when an account is picked, and empty values. */
function toTeacherEntry(
	commissionNumber: SubjectTeacherFormValue['commissionNumber'],
	choice: TeacherChoice,
): SubjectTeacherFormValue {
	const hasAccount = Boolean(choice.teacherId) && choice.teacherId !== 'NONE';
	const teacherName = choice.teacherName.trim();
	return {
		commissionNumber,
		...(hasAccount
			? { teacherId: choice.teacherId }
			: teacherName
				? { teacherName }
				: {}),
	};
}

function TeacherPicker({
	idPrefix,
	label,
	value,
	onChange,
	teachers,
}: {
	idPrefix: string;
	label: string;
	value: TeacherChoice;
	onChange: (value: TeacherChoice) => void;
	teachers: IUserResponse[];
}) {
	const hasAccount = Boolean(value.teacherId) && value.teacherId !== 'NONE';
	return (
		<div className="space-y-2">
			<Label htmlFor={`${idPrefix}-account`}>{label}</Label>
			<Select
				value={value.teacherId || 'NONE'}
				onValueChange={(teacherId) =>
					onChange({ ...value, teacherId: teacherId === 'NONE' ? '' : teacherId })
				}
			>
				<SelectTrigger id={`${idPrefix}-account`}>
					<SelectValue placeholder="Seleccione docente" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="NONE">Sin docente asignado</SelectItem>
					{teachers.map((t) => (
						<SelectItem key={t.id} value={t.id}>
							{t.firstName} {t.lastName} ({t.email})
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{!hasAccount && (
				<Input
					aria-label={`${label}: nombre del docente (sin usuario)`}
					placeholder="Nombre del docente (sin usuario)"
					value={value.teacherName}
					onChange={(event) =>
						onChange({ ...value, teacherName: event.target.value })
					}
				/>
			)}
		</div>
	);
}

export interface SubjectFormProps {
	courseId: string;
	onSubmit: (data: CreateSubjectFormValues) => Promise<void> | void;
	isLoading?: boolean;
	defaultValues?: Partial<CreateSubjectFormValues>;
	teachers?: IUserResponse[];
	isEditing?: boolean;
	onCancel?: () => void;
	/**
	 * Workshop commission numbers of the course. A teacher per commission is only
	 * offered for workshop subjects of a course with both commissions; undefined
	 * (unknown) keeps the single teacher field.
	 */
	commissionNumbers?: readonly CommissionNumber[];
}

export function SubjectForm({
	courseId,
	onSubmit,
	isLoading = false,
	defaultValues,
	teachers = [],
	isEditing = false,
	onCancel,
	commissionNumbers,
}: SubjectFormProps) {
	const form = useForm<CreateSubjectFormValues>({
		resolver: zodResolver(createSubjectSchema),
		defaultValues: {
			courseId: defaultValues?.courseId || courseId,
			name: defaultValues?.name || '',
			area: defaultValues?.area || '',
			weeklyHours: defaultValues?.weeklyHours || 4,
			teacherId: defaultValues?.teacherId || '',
			teacherName: defaultValues?.teacherName || '',
			kind: defaultValues?.kind || SUBJECT_KIND.THEORY,
		},
	});
	const teacherId = form.watch('teacherId');
	const hasTeacherAccount = Boolean(teacherId) && teacherId !== 'NONE';

	const canSplitByCommission =
		form.watch('kind') === SUBJECT_KIND.WORKSHOP &&
		COMMISSION_NUMBERS.every((n) => commissionNumbers?.includes(n));
	const [teacherMode, setTeacherMode] = useState<TeacherMode>(
		defaultValues?.teachers?.some((entry) => entry.commissionNumber !== null)
			? 'PER_COMMISSION'
			: 'SAME',
	);
	const [commissionTeachers, setCommissionTeachers] = useState<
		Record<CommissionNumber, TeacherChoice>
	>(() => {
		const initial = (n: CommissionNumber): TeacherChoice => {
			const entry = defaultValues?.teachers?.find((t) => t.commissionNumber === n);
			if (!entry) return NO_TEACHER;
			return {
				teacherId: entry.teacherId ?? '',
				teacherName: entry.teacherId ? '' : (entry.teacherName ?? ''),
			};
		};
		return { 1: initial(1), 2: initial(2) };
	});
	const perCommission = canSplitByCommission && teacherMode === 'PER_COMMISSION';

	const handleSubmit = (values: CreateSubjectFormValues) => {
		if (perCommission) {
			// `teachers` wins server side; the single-teacher fields are cleared.
			return onSubmit({
				...values,
				teacherId: '',
				teacherName: undefined,
				teachers: COMMISSION_NUMBERS.map((n) =>
					toTeacherEntry(n, commissionTeachers[n]),
				),
			});
		}
		const single = hasTeacherAccount
			? { ...values, teacherName: undefined }
			: { ...values, teacherName: values.teacherName?.trim() ?? '' };
		// An explicit whole-subject entry replaces any previous per-commission split.
		return onSubmit(
			canSplitByCommission
				? {
						...single,
						teachers: [
							toTeacherEntry(null, {
								teacherId: values.teacherId ?? '',
								teacherName: values.teacherName ?? '',
							}),
						],
					}
				: single,
		);
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleSubmit)}
				className="space-y-6 max-w-xl"
			>
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							{isEditing ? 'Editar Materia' : 'Nueva Materia'}
						</CardTitle>
					</CardHeader>
					<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem className="md:col-span-2">
									<FormLabel>Nombre de la Materia *</FormLabel>
									<FormControl>
										<Input placeholder="Ej. Matemática, Historia" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="area"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Área / Departamento *</FormLabel>
									<FormControl>
										<Input placeholder="Ej. Ciencias Exactas" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="weeklyHours"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Horas Semanales *</FormLabel>
									<FormControl>
										<Input type="number" min="1" max="40" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="kind"
							render={({ field }) => (
								<FormItem className="md:col-span-2">
									<FormLabel>Tipo *</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
										value={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleccione tipo" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value={SUBJECT_KIND.THEORY}>Teórica</SelectItem>
											<SelectItem value={SUBJECT_KIND.WORKSHOP}>Taller</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						{canSplitByCommission && (
							<div className="md:col-span-2 space-y-2">
								<Label>Asignación de docentes</Label>
								<RadioGroup
									value={teacherMode}
									onValueChange={(value) => setTeacherMode(value as TeacherMode)}
								>
									<div className="flex items-center gap-2">
										<RadioGroupItem value="SAME" id="subject-teacher-mode-same" />
										<Label htmlFor="subject-teacher-mode-same">
											Mismo docente para ambas comisiones
										</Label>
									</div>
									<div className="flex items-center gap-2">
										<RadioGroupItem
											value="PER_COMMISSION"
											id="subject-teacher-mode-split"
										/>
										<Label htmlFor="subject-teacher-mode-split">
											Un docente por comisión
										</Label>
									</div>
								</RadioGroup>
							</div>
						)}

						{perCommission &&
							COMMISSION_NUMBERS.map((n) => (
								<div key={n} className="md:col-span-2">
									<TeacherPicker
										idPrefix={`subject-teacher-c${n}`}
										label={`Docente Comisión ${n}`}
										value={commissionTeachers[n]}
										onChange={(choice) =>
											setCommissionTeachers((prev) => ({ ...prev, [n]: choice }))
										}
										teachers={teachers}
									/>
								</div>
							))}

						{!perCommission && (
							<FormField
								control={form.control}
								name="teacherId"
								render={({ field }) => (
									<FormItem className="md:col-span-2">
										<FormLabel>Docente Titular (Opcional)</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value || 'NONE'}
											value={field.value || 'NONE'}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccione docente" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="NONE">Sin docente asignado</SelectItem>
												{teachers.map((t) => (
													<SelectItem key={t.id} value={t.id}>
														{t.firstName} {t.lastName} ({t.email})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{!perCommission && !hasTeacherAccount && (
							<FormField
								control={form.control}
								name="teacherName"
								render={({ field }) => (
									<FormItem className="md:col-span-2">
										<FormLabel>Nombre del docente (sin usuario)</FormLabel>
										<FormControl>
											<Input placeholder="Ej. Laura Gómez" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
					</CardContent>
				</Card>

				<div className="flex items-center justify-end gap-3">
					{onCancel && (
						<Button
							type="button"
							variant="outline"
							onClick={onCancel}
							disabled={isLoading}
						>
							Cancelar
						</Button>
					)}
					<Button type="submit" disabled={isLoading}>
						{isLoading
							? 'Guardando...'
							: isEditing
								? 'Guardar Cambios'
								: 'Crear Materia'}
					</Button>
				</div>
			</form>
		</Form>
	);
}
