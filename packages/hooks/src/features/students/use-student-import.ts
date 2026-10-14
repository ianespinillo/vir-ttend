import {
	type ApiResponse,
	type ErrorResponse,
	type IStudentImportCommitResponse,
	type IStudentImportPreviewResponse,
	STUDENT_ROUTES,
} from '@repo/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';

export const STUDENT_IMPORT_TEMPLATE_FILENAME = 'plantilla-alumnos.xlsx';

/** Error body of the commit endpoint; `details` carries the preview payload on 422. */
export type StudentImportErrorResponse = Omit<ErrorResponse, 'message'> & {
	message: string | string[];
	details?: IStudentImportPreviewResponse;
};

export type StudentImportError = AxiosError<StudentImportErrorResponse>;

export interface StudentImportVariables {
	courseId: string;
	file: File;
}

function toFormData(file: File): FormData {
	const form = new FormData();
	form.append('file', file);
	return form;
}

export function useStudentImportPreview() {
	return useMutation<
		IStudentImportPreviewResponse,
		StudentImportError,
		StudentImportVariables
	>({
		mutationFn: async ({ courseId, file }) => {
			const res = await apiClient.post<ApiResponse<IStudentImportPreviewResponse>>(
				STUDENT_ROUTES.importPreview,
				toFormData(file),
				{
					params: { courseId },
					headers: { 'Content-Type': 'multipart/form-data' },
				},
			);
			return res.data.data;
		},
	});
}

export function useCommitStudentImport() {
	const queryClient = useQueryClient();

	return useMutation<
		IStudentImportCommitResponse,
		StudentImportError,
		StudentImportVariables
	>({
		mutationFn: async ({ courseId, file }) => {
			const res = await apiClient.post<ApiResponse<IStudentImportCommitResponse>>(
				STUDENT_ROUTES.importCommit,
				toFormData(file),
				{
					params: { courseId },
					headers: { 'Content-Type': 'multipart/form-data' },
				},
			);
			return res.data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.students.list() });
			queryClient.invalidateQueries({ queryKey: ['courses'] });
		},
	});
}

/** Downloads the .xlsx template through the authenticated client. */
export function useDownloadStudentImportTemplate() {
	return useMutation<void, Error, void>({
		mutationFn: async () => {
			const res = await apiClient.get<Blob>(STUDENT_ROUTES.importTemplate, {
				responseType: 'blob',
			});
			const url = URL.createObjectURL(res.data);
			const a = document.createElement('a');
			a.href = url;
			a.download = STUDENT_IMPORT_TEMPLATE_FILENAME;
			a.click();
			URL.revokeObjectURL(url);
		},
	});
}
