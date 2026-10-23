// @vitest-environment jsdom
import { ACADEMIC_ROUTES } from '@repo/common';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import React, { type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../lib/axios-client';
import { useSetCourseStatus } from './use-set-course-status';

const mock = new MockAdapter(apiClient);

function setup() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
	return { wrapper, invalidate };
}

describe('useSetCourseStatus', () => {
	afterEach(() => {
		mock.reset();
	});

	it('patches the course status and invalidates course and workshop queries', async () => {
		let sentBody: unknown;
		mock.onPatch(ACADEMIC_ROUTES.courseStatus('course-1')).reply((config) => {
			sentBody = JSON.parse(config.data);
			return [200, { success: true, data: { id: 'course-1', isActive: false } }];
		});
		const { wrapper, invalidate } = setup();

		const { result } = renderHook(() => useSetCourseStatus(), { wrapper });
		await act(async () => {
			await result.current.mutateAsync({ courseId: 'course-1', isActive: false });
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(sentBody).toEqual({ isActive: false });
		expect(result.current.data).toEqual({ id: 'course-1', isActive: false });
		const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
		expect(keys).toContainEqual(['courses', 'detail', 'course-1']);
		expect(keys).toContainEqual(['courses']);
		expect(keys).toContainEqual(['attendance', 'workshop']);
	});

	it('surfaces the API error', async () => {
		mock.onPatch(ACADEMIC_ROUTES.courseStatus('course-1')).reply(404, {
			message: 'Curso no encontrado',
		});
		const { wrapper } = setup();

		const { result } = renderHook(() => useSetCourseStatus(), { wrapper });
		await act(async () => {
			await result.current
				.mutateAsync({ courseId: 'course-1', isActive: true })
				.catch(() => undefined);
		});

		await waitFor(() => expect(result.current.isError).toBe(true));
	});
});
