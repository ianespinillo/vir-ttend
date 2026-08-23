import { type ExportReportRequest, REPORT_ROUTES } from '@repo/common';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../lib/axios-client';

function resolveFilename(disposition: unknown, fallback: string): string {
	if (typeof disposition !== 'string') return fallback;
	const match = /filename\*?=(?:UTF-8'')?"([^";]+)"/i.exec(disposition);
	if (!match?.[1]) return fallback;
	try {
		return decodeURIComponent(match[1]);
	} catch {
		return match[1];
	}
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
	return useMutation<void, Error, ExportReportRequest>({
		mutationFn: async (data) => {
			const res = await apiClient.post(REPORT_ROUTES.exportExcel, data, {
				responseType: 'blob',
			});
			const fallback = `reporte-${data.courseId}-${data.year}-${String(
				data.month,
			).padStart(2, '0')}.xlsx`;
			downloadBlob(
				res.data as Blob,
				resolveFilename(res.headers['content-disposition'], fallback),
			);
		},
	});
}

export function useExportPdf() {
	return useMutation<void, Error, ExportReportRequest>({
		mutationFn: async (data) => {
			const res = await apiClient.post(REPORT_ROUTES.exportPdf, data, {
				responseType: 'blob',
			});
			const fallback = `reporte-${data.courseId}-${data.year}-${String(
				data.month,
			).padStart(2, '0')}.pdf`;
			downloadBlob(
				res.data as Blob,
				resolveFilename(res.headers['content-disposition'], fallback),
			);
		},
	});
}
