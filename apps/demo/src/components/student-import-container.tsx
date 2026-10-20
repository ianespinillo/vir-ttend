'use client';

/**
 * Demo wiring of the product's bulk import dialog (apps/client
 * StudentImportContainer): same `StudentImportDialog`, but the template,
 * validation and commit are simulated in memory (see lib/students/student-import).
 */

import { useDemo } from '@/lib/session/demo-provider';
import {
	IMPORT_TEMPLATE_FILENAME,
	buildImportTemplateCsv,
	previewImportFile,
	validPreviewRows,
} from '@/lib/students/student-import';
import type { IStudentImportPreviewResponse } from '@repo/common';
import { StudentImportDialog } from '@repo/ui';
import { useState } from 'react';
import { toast } from 'sonner';

interface DemoStudentImportContainerProps {
	courseId: string;
	courseName: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function downloadTemplate() {
	const blob = new Blob([`﻿${buildImportTemplateCsv()}`], {
		type: 'text/csv;charset=utf-8',
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = IMPORT_TEMPLATE_FILENAME;
	link.click();
	URL.revokeObjectURL(url);
}

export function DemoStudentImportContainer({
	courseId,
	courseName,
	open,
	onOpenChange,
}: DemoStudentImportContainerProps) {
	const { state, store } = useDemo();
	const [file, setFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<IStudentImportPreviewResponse | null>(
		null,
	);
	const [isValidating, setIsValidating] = useState(false);

	const reset = () => {
		setFile(null);
		setPreview(null);
		setIsValidating(false);
	};

	const handleOpenChange = (next: boolean) => {
		if (!next) reset();
		onOpenChange(next);
	};

	const handleFileChange = (next: File | null) => {
		setFile(next);
		setPreview(null);
	};

	const handleValidate = async () => {
		if (!file) return;
		setIsValidating(true);
		try {
			const existing = new Set(
				state.students.map((student) => student.documentNumber),
			);
			setPreview(await previewImportFile(file, courseId, existing));
		} catch {
			toast.error('No se pudo validar el archivo');
		} finally {
			setIsValidating(false);
		}
	};

	const handleConfirm = () => {
		if (!preview) return;
		const created = store.importStudents(courseId, validPreviewRows(preview));
		toast.success(`Se importaron ${created} alumnos`);
		handleOpenChange(false);
	};

	return (
		<StudentImportDialog
			open={open}
			onOpenChange={handleOpenChange}
			courseName={courseName}
			file={file}
			preview={preview}
			onFileChange={handleFileChange}
			onDownloadTemplate={downloadTemplate}
			onValidate={handleValidate}
			onConfirm={handleConfirm}
			onPickAnotherFile={reset}
			isDownloading={false}
			isValidating={isValidating}
			isImporting={false}
		/>
	);
}
