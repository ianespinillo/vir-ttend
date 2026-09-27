'use client';

import { useDemo } from '@/lib/session/demo-provider';
import type {
	CreateAcademicYearFormValues,
	IAcademicYearResponse,
} from '@repo/common';
import { ROLES } from '@repo/common';
import {
	AcademicYearCard,
	AcademicYearForm,
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	ForbiddenState,
	PageHeader,
} from '@repo/ui';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AcademicSettingsPage() {
	const { state, session, selectors } = useDemo();
	const user = session.user;
	const role = user?.role;
	const isAdmin = role === ROLES.ADMIN || role === ROLES.SUPERADMIN;

	const years = selectors.getAcademicYears(state);

	const [modalState, setModalState] = useState<{
		open: boolean;
		year: IAcademicYearResponse | null;
	}>({ open: false, year: null });

	if (!isAdmin) {
		return (
			<ForbiddenState
				title="Acceso restringido"
				description="Solo los administradores pueden gestionar la configuración académica."
			/>
		);
	}

	const handleSave = (
		_values: CreateAcademicYearFormValues & { isActive?: boolean },
	) => {
		toast.success(
			modalState.year
				? 'Ciclo lectivo actualizado correctamente'
				: 'Ciclo lectivo creado correctamente',
		);
		setModalState({ open: false, year: null });
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

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{years.map((ay) => (
					<AcademicYearCard
						key={ay.id}
						academicYear={ay}
						onEdit={(year) => setModalState({ open: true, year })}
						canEdit={isAdmin}
					/>
				))}
			</div>

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
						isLoading={false}
						onCancel={() => setModalState({ open: false, year: null })}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
