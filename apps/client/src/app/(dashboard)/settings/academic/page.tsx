'use client';

import type {
	CreateAcademicYearFormValues,
	IAcademicYearResponse,
} from '@repo/common';
import {
	useAcademicYears,
	useCreateAcademicYear,
	useUpdateAcademicYear,
} from '@repo/hooks';
import {
	AcademicYearCard,
	AcademicYearForm,
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	ErrorState,
	ForbiddenState,
	LoadingSpinner,
	PageHeader,
} from '@repo/ui';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../../../lib/auth/provider';

export default function AcademicSettingsPage() {
	const { user } = useAuth();
	const role = user?.role?.toLowerCase();
	const isAdmin = role === 'admin' || role === 'superadmin';

	const { data: years, isLoading, isError, error } = useAcademicYears();
	const createMutation = useCreateAcademicYear();
	const updateMutation = useUpdateAcademicYear();

	const [modalState, setModalState] = useState<{
		open: boolean;
		year: IAcademicYearResponse | null;
	}>({ open: false, year: null });

	const [formError, setFormError] = useState<string | null>(null);

	if (!isAdmin) {
		return (
			<ForbiddenState
				title="Acceso restringido"
				description="Solo los administradores pueden gestionar la configuración académica."
			/>
		);
	}

	const handleSave = async (
		values: CreateAcademicYearFormValues & { isActive?: boolean },
	) => {
		setFormError(null);
		try {
			if (modalState.year) {
				await updateMutation.mutateAsync({
					id: modalState.year.id,
					data: values,
				});
			} else {
				await createMutation.mutateAsync(values);
			}
			setModalState({ open: false, year: null });
		} catch (err: unknown) {
			const errorObj = err as {
				response?: { data?: { message?: string } };
				message?: string;
			};
			setFormError(
				errorObj?.response?.data?.message ||
					errorObj?.message ||
					'Ocurrió un error al guardar el ciclo lectivo.',
			);
		}
	};

	return (
		<div className="space-y-6 max-w-4xl">
			<PageHeader
				title="Configuración Académica — Años Lectivos"
				description="Gestione los ciclos lectivos de la institución, fechas y parámetros de inasistencias"
				actions={
					<Button
						onClick={() => setModalState({ open: true, year: null })}
						className="gap-2"
					>
						<Plus className="h-4 w-4" />
						Nuevo Año Lectivo
					</Button>
				}
			/>

			{isLoading ? (
				<div className="flex h-64 items-center justify-center">
					<LoadingSpinner />
				</div>
			) : isError ? (
				<ErrorState
					title="Error al cargar ciclos lectivos"
					description={(error as Error)?.message || 'Ocurrió un error inesperado.'}
				/>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{(years || []).map((ay) => (
						<AcademicYearCard
							key={ay.id}
							academicYear={ay}
							onEdit={(year) => setModalState({ open: true, year })}
							canEdit={isAdmin}
						/>
					))}
				</div>
			)}

			<Dialog
				open={modalState.open}
				onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}
			>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>
							{modalState.year
								? `Editar Ciclo Lectivo ${modalState.year.year}`
								: 'Nuevo Ciclo Lectivo'}
						</DialogTitle>
					</DialogHeader>

					{formError && (
						<div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm font-medium">
							{formError}
						</div>
					)}

					<AcademicYearForm
						isEditing={Boolean(modalState.year)}
						defaultValues={
							modalState.year
								? {
										year: modalState.year.year,
										startDate: String(modalState.year.startDate).split('T')[0],
										endDate: String(modalState.year.endDate).split('T')[0],
										absenceThresholdPercent: modalState.year.absenceThresholdPercent,
										lateCountAbscenseAfterMinutes:
											modalState.year.lateCountAbscenseAfterMinutes,
										isActive: modalState.year.isActive,
									}
								: undefined
						}
						onSubmit={handleSave}
						isLoading={createMutation.isPending || updateMutation.isPending}
						onCancel={() => setModalState({ open: false, year: null })}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
