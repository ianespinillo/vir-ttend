'use client';
import { useDemo } from '@/lib/session/demo-provider';
import type {
	CreateAcademicYearFormValues,
	DeclareNonWorkingDayFormValues,
	IAcademicYearResponse,
} from '@repo/common';
import { ROLES } from '@repo/common';
import {
	AcademicYearCard,
	AcademicYearForm,
	Button,
	DeclareNonWorkingDayDialog,
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
	const { state, session, selectors, store } = useDemo();
	const user = session.user;
	const role = user?.role;
	const isAdmin = role === ROLES.ADMIN || role === ROLES.SUPERADMIN;

	const years = selectors.getAcademicYears(state);

	const [modalState, setModalState] = useState<{
		open: boolean;
		year: IAcademicYearResponse | null;
	}>({ open: false, year: null });

	const [declareModalState, setDeclareModalState] = useState<{
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

	const handleDeclareNonWorkingDay = (
		values: DeclareNonWorkingDayFormValues,
	) => {
		if (!declareModalState.year) return;
		store.declareNonWorkingDay(declareModalState.year.id, {
			date: values.date,
			reason: values.reason,
			type: values.type,
			notifySchool: values.notifySchool,
			shifts: values.shifts,
			authorName: user ? `${user.firstName} ${user.lastName}` : 'Equipo Directivo',
		});
		toast.success(
			values.notifySchool
				? 'Día no laborable registrado y comunicado institucional publicado'
				: 'Día no laborable registrado correctamente',
		);
		setDeclareModalState({ open: false, year: null });
	};

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
						onDeclareNonWorkingDay={(year) =>
							setDeclareModalState({ open: true, year })
						}
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

			<DeclareNonWorkingDayDialog
				open={declareModalState.open}
				onOpenChange={(open) => setDeclareModalState((prev) => ({ ...prev, open }))}
				academicYear={declareModalState.year}
				onSubmit={handleDeclareNonWorkingDay}
				isLoading={false}
			/>
		</div>
	);
}
