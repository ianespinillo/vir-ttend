import { REPORT_ROUTES } from '@repo/common';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

export interface ExportReportPayload {
	courseId: string;
	month: number;
	year: number;
	type?: 'monthly' | 'student';
	studentId?: string;
}

function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export function useExportExcel() {
	return useMutation<void, Error, ExportReportPayload>({
		mutationFn: async (data) => {
			const res = await apiClient.post(REPORT_ROUTES.exportExcel, data, {
				responseType: 'blob',
			});
			downloadBlob(
				res.data as Blob,
				`reporte-${data.courseId}-${data.year}-${data.month}.xlsx`,
			);
		},
	});
}

export function useExportPdf() {
	return useMutation<void, Error, ExportReportPayload>({
		mutationFn: async (data) => {
			const res = await apiClient.post(REPORT_ROUTES.exportPdf, data, {
				responseType: 'blob',
			});
			downloadBlob(
				res.data as Blob,
				`reporte-${data.courseId}-${data.year}-${data.month}.pdf`,
			);
		},
	});
}
