'use client';

import { Calendar, Copy } from 'lucide-react';
import { Button } from '../../../ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '../../../ui/dialog';

export interface CopyAttendanceModalProps {
	isOpen: boolean;
	onClose: () => void;
	subjectName?: string;
	targetDate: string;
	sourceDate?: string;
	onConfirm: () => Promise<void>;
	isSubmitting?: boolean;
}

export function CopyAttendanceModal({
	isOpen,
	onClose,
	subjectName,
	targetDate,
	sourceDate,
	onConfirm,
	isSubmitting,
}: CopyAttendanceModalProps) {
	const handleConfirm = async () => {
		await onConfirm();
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Copy className="h-5 w-5 text-primary shrink-0" />
						Copiar Asistencia de Clase Anterior
					</DialogTitle>
					<DialogDescription>
						Se copiarán los estados de la clase{' '}
						{sourceDate ? `del ${sourceDate}` : 'anterior'} para{' '}
						{subjectName || 'la materia'} a la fecha actual ({targetDate}).
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3 py-3 text-sm text-muted-foreground border-y border-border/60">
					<div className="flex items-center gap-2 text-foreground">
						<Calendar className="h-4 w-4 text-primary" />
						<span>
							Fecha destino: <strong>{targetDate}</strong>
						</span>
					</div>
					<p className="text-xs">
						<strong>Nota:</strong> Los registros que ya fueron completados para esta
						fecha NO se sobrescribirán.
					</p>
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
					<Button type="button" onClick={handleConfirm} disabled={isSubmitting}>
						{isSubmitting ? 'Copiando...' : 'Confirmar Copia'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
