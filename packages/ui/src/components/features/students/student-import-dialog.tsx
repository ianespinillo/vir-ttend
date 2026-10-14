import type { IStudentImportPreviewResponse } from '@repo/common';
import { Download } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { Button } from '../../../ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '../../../ui/dialog';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { StudentImportPreview } from './student-import-preview';

export interface StudentImportDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	courseName: string;
	file: File | null;
	preview: IStudentImportPreviewResponse | null;
	onFileChange: (file: File | null) => void;
	onDownloadTemplate: () => void;
	onValidate: () => void;
	onConfirm: () => void;
	onPickAnotherFile: () => void;
	isDownloading?: boolean;
	isValidating?: boolean;
	isImporting?: boolean;
}

export function StudentImportDialog({
	open,
	onOpenChange,
	courseName,
	file,
	preview,
	onFileChange,
	onDownloadTemplate,
	onValidate,
	onConfirm,
	onPickAnotherFile,
	isDownloading = false,
	isValidating = false,
	isImporting = false,
}: StudentImportDialogProps) {
	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		onFileChange(event.target.files?.[0] ?? null);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-4xl">
				<DialogHeader>
					<DialogTitle>Importar alumnos</DialogTitle>
					<DialogDescription>
						Curso: {courseName}. Descargue la plantilla, complétela y súbala para
						validarla antes de importar.
					</DialogDescription>
				</DialogHeader>

				{preview ? (
					<StudentImportPreview
						preview={preview}
						onConfirm={onConfirm}
						onPickAnotherFile={onPickAnotherFile}
						isImporting={isImporting}
					/>
				) : (
					<div className="space-y-4">
						<Button
							type="button"
							variant="outline"
							onClick={onDownloadTemplate}
							disabled={isDownloading}
							className="gap-2"
						>
							<Download className="h-4 w-4" aria-hidden="true" />
							{isDownloading ? 'Descargando...' : 'Descargar plantilla'}
						</Button>

						<div className="space-y-2">
							<Label htmlFor="student-import-file">Archivo de alumnos (.xlsx)</Label>
							<Input
								id="student-import-file"
								type="file"
								accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
								onChange={handleFileChange}
							/>
						</div>

						<div className="flex justify-end">
							<Button
								type="button"
								onClick={onValidate}
								disabled={!file || isValidating}
							>
								{isValidating ? 'Validando...' : 'Validar archivo'}
							</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
