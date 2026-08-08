'use client';

import { useState } from 'react';
import { Button } from '../../../../ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '../../../../ui/dialog';
import { Input } from '../../../../ui/input';
import { Label } from '../../../../ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../../ui/select';

export interface JustificationModalProps {
	isOpen: boolean;
	onClose: () => void;
	studentName?: string;
	onConfirm: (reason: string, notes?: string) => Promise<void>;
	isSubmitting?: boolean;
}

const PRESET_REASONS = [
	'Certificado médico',
	'Motivos personales / familiares',
	'Trámite personal',
	'Problema de transporte',
	'Licencia escolar',
	'Otro',
];

export function JustificationModal({
	isOpen,
	onClose,
	studentName,
	onConfirm,
	isSubmitting,
}: JustificationModalProps) {
	const [reason, setReason] = useState<string>('');
	const [customReason, setCustomReason] = useState<string>('');
	const [notes, setNotes] = useState<string>('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const finalReason = reason === 'Otro' ? customReason : reason;
		if (!finalReason.trim()) return;

		await onConfirm(finalReason.trim(), notes.trim() || undefined);
		setReason('');
		setCustomReason('');
		setNotes('');
		onClose();
	};

	const finalReasonValid =
		reason === 'Otro' ? Boolean(customReason.trim()) : Boolean(reason);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Justificar Inasistencia</DialogTitle>
						<DialogDescription>
							{studentName
								? `Registrar motivo de inasistencia/tardanza para ${studentName}.`
								: 'Registrar motivo de inasistencia o tardanza.'}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="reason">Motivo</Label>
							<Select value={reason} onValueChange={setReason}>
								<SelectTrigger id="reason">
									<SelectValue placeholder="Seleccionar motivo..." />
								</SelectTrigger>
								<SelectContent>
									{PRESET_REASONS.map((r) => (
										<SelectItem key={r} value={r}>
											{r}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{reason === 'Otro' && (
							<div className="space-y-2">
								<Label htmlFor="customReason">Especificar motivo</Label>
								<Input
									id="customReason"
									value={customReason}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										setCustomReason(e.target.value)
									}
									placeholder="Escriba el motivo..."
									required
								/>
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="notes">Notas adicionales (opcional)</Label>
							<Input
								id="notes"
								value={notes}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setNotes(e.target.value)
								}
								placeholder="Ej: Presenta comprobante N° 123..."
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isSubmitting}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={!finalReasonValid || isSubmitting}>
							{isSubmitting ? 'Guardando...' : 'Guardar Justificación'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
