'use client';

import type { IStudentImportPreviewResponse } from '@repo/common';
import {
	type StudentImportError,
	useCommitStudentImport,
	useDownloadStudentImportTemplate,
	useStudentImportPreview,
} from '@repo/hooks';
import { StudentImportDialog } from '@repo/ui';
import { useState } from 'react';
import { toast } from 'sonner';

interface StudentImportContainerProps {
	courseId: string;
	courseName: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function errorMessage(error: StudentImportError, fallback: string): string {
	const message = error.response?.data?.message;
	if (Array.isArray(message)) return message.join(', ');
	return message || error.message || fallback;
}

export function StudentImportContainer({
	courseId,
	courseName,
	open,
	onOpenChange,
}: StudentImportContainerProps) {
	const [file, setFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<IStudentImportPreviewResponse | null>(
		null,
	);

	const downloadTemplate = useDownloadStudentImportTemplate();
	const previewMutation = useStudentImportPreview();
	const commitMutation = useCommitStudentImport();

	const reset = () => {
		setFile(null);
		setPreview(null);
	};

	const handleOpenChange = (next: boolean) => {
		if (!next) reset();
		onOpenChange(next);
	};

	const handleDownload = () => {
		downloadTemplate.mutate(undefined, {
			onError: () => toast.error('No se pudo descargar la plantilla'),
		});
	};

	const handleValidate = () => {
		if (!file) return;
		previewMutation.mutate(
			{ courseId, file },
			{
				onSuccess: setPreview,
				onError: (err) =>
					toast.error(errorMessage(err, 'No se pudo validar el archivo')),
			},
		);
	};

	const handleConfirm = () => {
		if (!file) return;
		commitMutation.mutate(
			{ courseId, file },
			{
				onSuccess: ({ created }) => {
					toast.success(`Se importaron ${created} alumnos`);
					handleOpenChange(false);
				},
				onError: (err) => {
					const details = err.response?.data?.details;
					if (err.response?.status === 422 && details) {
						setPreview(details);
						return;
					}
					toast.error(errorMessage(err, 'No se pudo importar el archivo'));
				},
			},
		);
	};

	return (
		<StudentImportDialog
			open={open}
			onOpenChange={handleOpenChange}
			courseName={courseName}
			file={file}
			preview={preview}
			onFileChange={setFile}
			onDownloadTemplate={handleDownload}
			onValidate={handleValidate}
			onConfirm={handleConfirm}
			onPickAnotherFile={reset}
			isDownloading={downloadTemplate.isPending}
			isValidating={previewMutation.isPending}
			isImporting={commitMutation.isPending}
		/>
	);
}
