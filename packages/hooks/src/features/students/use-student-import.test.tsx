// @vitest-environment jsdom
import { STUDENT_ROUTES } from '@repo/common';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import React, { type ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { apiClient } from '../../lib/axios-client';
import {
	useCommitStudentImport,
	useStudentImportPreview,
} from './use-student-import';

const mock = new MockAdapter(apiClient);

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { mutations: { retry: false } },
	});
	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

const file = new File(['x'], 'alumnos.xlsx');

describe('student import hooks', () => {
	afterEach(() => {
		mock.reset();
	});

	it('preview posts the file as multipart with courseId in the query', async () => {
		let sent: { data: unknown; params: unknown } | undefined;
		const payload = {
			courseId: 'c-1',
			totalRows: 0,
			validRows: 0,
			invalidRows: 0,
			rows: [],
		};
		mock.onPost(STUDENT_ROUTES.importPreview).reply((config) => {
			sent = { data: config.data, params: config.params };
			return [201, { success: true, data: payload }];
		});

		const { result } = renderHook(() => useStudentImportPreview(), {
			wrapper: createWrapper(),
		});
		result.current.mutate({ courseId: 'c-1', file });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(sent?.params).toEqual({ courseId: 'c-1' });
		expect(sent?.data).toBeInstanceOf(FormData);
		expect((sent?.data as FormData).get('file')).toBeInstanceOf(File);
		expect(result.current.data).toEqual(payload);
	});

	it('commit exposes the 422 preview payload as error details', async () => {
		const details = {
			courseId: 'c-1',
			totalRows: 1,
			validRows: 0,
			invalidRows: 1,
			rows: [],
		};
		mock
			.onPost(STUDENT_ROUTES.importCommit)
			.reply(422, { statusCode: 422, message: 'Hay filas con errores', details });

		const { result } = renderHook(() => useCommitStudentImport(), {
			wrapper: createWrapper(),
		});
		result.current.mutate({ courseId: 'c-1', file });

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.error?.response?.data.details).toEqual(details);
	});
});
